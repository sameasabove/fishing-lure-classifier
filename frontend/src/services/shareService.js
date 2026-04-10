import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Share catch card with Strava-style design
 */
export const shareCatchCard = async (cardRef) => {
  try {
    if (!cardRef || !cardRef.current) {
      throw new Error('Share card reference is not available');
    }

    // Capture the view as an image
    const uri = await cardRef.current.capture();
    
    // The captured URI is already in the file system, we can use it directly
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Share the image directly
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your catch!',
        UTI: Platform.OS === 'ios' ? 'public.jpeg' : 'image/jpeg',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    return uri;
  } catch (error) {
    console.error('Error sharing catch card:', error);
    throw error;
  }
};

/**
 * Get share card dimensions (9:16 aspect ratio for stories)
 */
export const getShareCardDimensions = () => {
  return {
    width: 1080,
    height: 1920, // 9:16 aspect ratio
  };
};
