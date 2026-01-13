/**
 * API Service for TINA - 360 Image Viewer
 * Uses Supabase for backend
 */

import { supabase } from '../lib/supabase';

// Get user email - can be customized or set via environment
// For single-user deployments, this can be a static value
function getUserEmail() {
  return localStorage.getItem('tina_user_email') || 'default@user.com';
}

// Set user email (call this on app init if needed)
export function setUserEmail(email) {
  localStorage.setItem('tina_user_email', email);
}

/**
 * Create a thumbnail from an image file
 * @param {File} file - The original image file
 * @param {number} maxSize - Maximum width/height for thumbnail
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>}
 */
async function createThumbnail(file, maxSize = 300, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Projects API
 */
export const projectsAPI = {
  /**
   * Get all projects
   */
  async getAll() {
    const { data, error } = await supabase
      .from('tina_projects')
      .select('*')
      .eq('user_email', getUserEmail())
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      display_order: p.display_order,
      created_date: p.created_at,
      updated_date: p.updated_at,
    }));
  },

  /**
   * Create a new project
   */
  async create(name, description = '') {
    // Get max display_order
    const { data: existing } = await supabase
      .from('tina_projects')
      .select('display_order')
      .eq('user_email', getUserEmail())
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('tina_projects')
      .insert({
        user_email: getUserEmail(),
        name,
        description,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      display_order: data.display_order,
      created_date: data.created_at,
    };
  },

  /**
   * Update a project
   */
  async update(id, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.display_order !== undefined) updateData.display_order = updates.display_order;

    const { data, error } = await supabase
      .from('tina_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a project
   */
  async delete(id) {
    // First delete all images from storage
    const { data: images } = await supabase
      .from('tina_images')
      .select('storage_path')
      .eq('project_id', id);

    if (images && images.length > 0) {
      const paths = images.map(img => img.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('tina-images').remove(paths);
      }
    }

    // Delete images from database
    await supabase.from('tina_images').delete().eq('project_id', id);

    // Delete project
    const { error } = await supabase
      .from('tina_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};

/**
 * Images API
 */
export const imagesAPI = {
  /**
   * Get all images for a project
   */
  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('tina_images')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching images:', error);
      throw error;
    }

    return (data || []).map(img => ({
      id: img.id,
      project_id: img.project_id,
      filename: img.filename,
      file_path: img.storage_path,
      file_size: img.file_size,
      mime_type: img.mime_type,
      display_order: img.display_order,
      thumbnail_path: img.thumbnail_path,
      upload_date: img.created_at,
    }));
  },

  /**
   * Delete an image
   */
  async delete(imageId) {
    // Get image to find storage path
    const { data: image } = await supabase
      .from('tina_images')
      .select('storage_path, thumbnail_path')
      .eq('id', imageId)
      .single();

    // Delete from storage
    const pathsToDelete = [];
    if (image?.storage_path) pathsToDelete.push(image.storage_path);
    if (image?.thumbnail_path) pathsToDelete.push(image.thumbnail_path);

    if (pathsToDelete.length > 0) {
      await supabase.storage.from('tina-images').remove(pathsToDelete);
    }

    // Delete from database
    const { error } = await supabase
      .from('tina_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Upload images to a project
   */
  async upload(projectId, files) {
    const results = { images: [], errors: [] };

    // Get max display_order for this project
    const { data: existing } = await supabase
      .from('tina_images')
      .select('display_order')
      .eq('project_id', projectId)
      .order('display_order', { ascending: false })
      .limit(1);

    let nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/${timestamp}-${baseName}`;
        const thumbnailPath = `${projectId}/thumbs/${timestamp}-${baseName}.jpg`;

        // Create thumbnail
        let thumbnailBlob = null;
        try {
          thumbnailBlob = await createThumbnail(file, 300, 0.8);
        } catch (thumbErr) {
          console.warn('Failed to create thumbnail:', thumbErr);
        }

        // Upload original to Supabase Storage (keep original for 360 quality)
        const { error: uploadError } = await supabase.storage
          .from('tina-images')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          results.errors.push({ filename: file.name, error: uploadError.message });
          continue;
        }

        // Upload thumbnail if created
        if (thumbnailBlob) {
          await supabase.storage
            .from('tina-images')
            .upload(thumbnailPath, thumbnailBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg',
            });
        }

        // Create database record
        const { data: imageRecord, error: dbError } = await supabase
          .from('tina_images')
          .insert({
            project_id: projectId,
            filename: file.name,
            storage_path: storagePath,
            thumbnail_path: thumbnailBlob ? thumbnailPath : null,
            file_size: file.size,
            mime_type: file.type,
            display_order: nextOrder++,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file
          await supabase.storage.from('tina-images').remove([storagePath]);
          results.errors.push({ filename: file.name, error: dbError.message });
          continue;
        }

        results.images.push(imageRecord);
      } catch (err) {
        results.errors.push({ filename: file.name, error: err.message });
      }
    }

    return results;
  },

  /**
   * Reorder images in a project
   */
  async reorder(imagesArray) {
    const updates = imagesArray.map((image, index) =>
      supabase
        .from('tina_images')
        .update({ display_order: index })
        .eq('id', image.id)
    );
    await Promise.all(updates);
    return { updated: imagesArray.length };
  },
};

/**
 * Get full image URL from Supabase Storage
 */
export function getImageUrl(storagePath) {
  if (!storagePath) return '';

  // If it's already a full URL, return as-is
  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  const { data } = supabase.storage
    .from('tina-images')
    .getPublicUrl(storagePath);

  return data?.publicUrl || '';
}

/**
 * Get thumbnail URL, falling back to original if no thumbnail
 */
export function getThumbnailUrl(image) {
  if (image.thumbnail_path) {
    return getImageUrl(image.thumbnail_path);
  }
  return getImageUrl(image.file_path);
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
