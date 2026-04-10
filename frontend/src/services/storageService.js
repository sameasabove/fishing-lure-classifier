import AsyncStorage from '@react-native-async-storage/async-storage';

const TACKLE_BOX_KEY = 'tackle_box_lures';

export const saveLureToTackleBox = async (lureData) => {
  try {
    if (__DEV__) {
      console.log('Saving lure to tackle box:', lureData);
    }
    
    // Get existing tackle box
    const existingLures = await getTackleBox();
    
    // Create new lure entry - merge analysis data directly into the lure object
    const newLure = {
      id: Date.now().toString(), // Simple ID generation
      imageUri: lureData.imageUri,
      timestamp: lureData.timestamp || new Date().toISOString(),
      isFavorite: false, // New: favorite status
      catches: [], // New: array of catch photos
      catchCount: 0, // New: total catches
      // Spread the analysis data directly into the lure object
      ...lureData.analysis,
    };
    
    if (__DEV__) {
      console.log('Created new lure object:', newLure);
    }
    
    // Add to existing lures
    const updatedLures = [newLure, ...existingLures];
    
    if (__DEV__) {
      console.log('Updated lures array length:', updatedLures.length);
    }
    
    // Save back to storage
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(updatedLures));
    
    if (__DEV__) {
      console.log('Successfully saved to AsyncStorage');
    }
    
    return newLure;
  } catch (error) {
    if (__DEV__) {
      console.error('Error saving lure to tackle box:', error);
    }
    throw new Error('Failed to save lure to tackle box');
  }
};

export const getTackleBox = async () => {
  try {
    const tackleBoxData = await AsyncStorage.getItem(TACKLE_BOX_KEY);
    if (__DEV__) {
      console.log('Raw tackle box data from AsyncStorage:', tackleBoxData);
    }
    if (tackleBoxData) {
      const parsed = JSON.parse(tackleBoxData);
      if (__DEV__) {
        console.log('Parsed tackle box data:', parsed);
        console.log('Number of lures in tackle box:', parsed.length);
      }
      return parsed;
    }
    if (__DEV__) {
      console.log('No tackle box data found, returning empty array');
    }
    return [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error loading tackle box:', error);
    }
    return [];
  }
};

export const deleteLureFromTackleBox = async (lureId) => {
  try {
    const existingLures = await getTackleBox();
    const updatedLures = existingLures.filter(lure => lure.id !== lureId);
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(updatedLures));
    
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('Error deleting lure from tackle box:', error);
    }
    throw new Error('Failed to delete lure from tackle box');
  }
};

export const clearTackleBox = async () => {
  try {
    await AsyncStorage.removeItem(TACKLE_BOX_KEY);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('Error clearing tackle box:', error);
    }
    throw new Error('Failed to clear tackle box');
  }
};

export const getLureById = async (lureId) => {
  try {
    const tackleBox = await getTackleBox();
    return tackleBox.find(lure => lure.id === lureId);
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting lure by ID:', error);
    }
    return null;
  }
};

export const updateLureInTackleBox = async (lureId, updatedData) => {
  try {
    const existingLures = await getTackleBox();
    const lureIndex = existingLures.findIndex(lure => lure.id === lureId);
    
    if (lureIndex === -1) {
      throw new Error('Lure not found');
    }
    
    // Update the lure
    existingLures[lureIndex] = {
      ...existingLures[lureIndex],
      ...updatedData,
      id: lureId, // Ensure ID doesn't change
    };
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(existingLures));
    
    return existingLures[lureIndex];
  } catch (error) {
    if (__DEV__) {
      console.error('Error updating lure in tackle box:', error);
    }
    throw new Error('Failed to update lure in tackle box');
  }
};

// Toggle favorite status
export const toggleFavorite = async (lureId) => {
  try {
    const existingLures = await getTackleBox();
    const lureIndex = existingLures.findIndex(lure => lure.id === lureId);
    
    if (lureIndex === -1) {
      throw new Error('Lure not found');
    }
    
    // Toggle favorite status
    existingLures[lureIndex].isFavorite = !existingLures[lureIndex].isFavorite;
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(existingLures));
    
    return existingLures[lureIndex];
  } catch (error) {
    if (__DEV__) {
      console.error('Error toggling favorite:', error);
    }
    throw new Error('Failed to toggle favorite');
  }
};

// Add catch photo to a lure
export const addCatchToLure = async (lureId, catchData) => {
  try {
    const existingLures = await getTackleBox();
    const lureIndex = existingLures.findIndex(lure => lure.id === lureId);
    
    if (lureIndex === -1) {
      throw new Error('Lure not found');
    }
    
    const newCatch = {
      id: Date.now().toString(),
      imageUri: catchData.imageUri,
      timestamp: catchData.timestamp || new Date().toISOString(),
      notes: catchData.notes || '',
      location: catchData.location || '',
      fishSpecies: catchData.fishSpecies || '',
      weight: catchData.weight || '',
      length: catchData.length || '',
    };
    
    // Add catch to array
    if (!existingLures[lureIndex].catches) {
      existingLures[lureIndex].catches = [];
    }
    existingLures[lureIndex].catches.unshift(newCatch);
    
    // Update catch count
    existingLures[lureIndex].catchCount = existingLures[lureIndex].catches.length;
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(existingLures));
    
    return existingLures[lureIndex];
  } catch (error) {
    if (__DEV__) {
      console.error('Error adding catch:', error);
    }
    throw new Error('Failed to add catch');
  }
};

// Update catch in a lure
export const updateCatchFromLure = async (lureId, catchId, catchData) => {
  try {
    const existingLures = await getTackleBox();
    const lureIndex = existingLures.findIndex(lure => lure.id === lureId);
    
    if (lureIndex === -1) {
      throw new Error('Lure not found');
    }
    
    // Find and update the catch
    const catchIndex = existingLures[lureIndex].catches.findIndex(
      catch_ => catch_.id === catchId
    );
    
    if (catchIndex === -1) {
      throw new Error('Catch not found');
    }
    
    // Update catch data
    existingLures[lureIndex].catches[catchIndex] = {
      ...existingLures[lureIndex].catches[catchIndex],
      ...catchData,
      id: catchId, // Preserve the original ID
    };
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(existingLures));
    
    return existingLures[lureIndex].catches[catchIndex];
  } catch (error) {
    if (__DEV__) {
      console.error('Error updating catch:', error);
    }
    throw new Error('Failed to update catch');
  }
};

// Delete catch from a lure
export const deleteCatchFromLure = async (lureId, catchId) => {
  try {
    const existingLures = await getTackleBox();
    const lureIndex = existingLures.findIndex(lure => lure.id === lureId);
    
    if (lureIndex === -1) {
      throw new Error('Lure not found');
    }
    
    // Remove catch from array
    existingLures[lureIndex].catches = existingLures[lureIndex].catches.filter(
      catch_ => catch_.id !== catchId
    );
    
    // Update catch count
    existingLures[lureIndex].catchCount = existingLures[lureIndex].catches.length;
    
    await AsyncStorage.setItem(TACKLE_BOX_KEY, JSON.stringify(existingLures));
    
    return existingLures[lureIndex];
  } catch (error) {
    if (__DEV__) {
      console.error('Error deleting catch:', error);
    }
    throw new Error('Failed to delete catch');
  }
};

// Get all catches with location data from all lures (for map view)
export const getAllCatchesWithLocations = async () => {
  try {
    const tackleBox = await getTackleBox();
    const allCatches = [];
    
    tackleBox.forEach(lure => {
      if (lure.catches && Array.isArray(lure.catches)) {
        lure.catches.forEach(catch_ => {
          // Only include catches with location data
          if (catch_.latitude && catch_.longitude) {
            allCatches.push({
              ...catch_,
              lureId: lure.id,
              lureType: lure.lure_type,
              lureImageUri: lure.imageUri || lure.image_url,
            });
          }
        });
      }
    });
    
    return allCatches;
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting all catches with locations:', error);
    }
    return [];
  }
};

export const getTackleBoxStats = async () => {
  try {
    const tackleBox = await getTackleBox();
    
    const stats = {
      totalLures: tackleBox.length,
      favoriteLures: tackleBox.filter(lure => lure.isFavorite).length,
      totalCatches: tackleBox.reduce((sum, lure) => sum + (lure.catchCount || 0), 0),
      lureTypes: {},
      totalConfidence: 0,
      averageConfidence: 0,
      bestPerformingLures: [],
    };
    
    if (tackleBox.length > 0) {
      tackleBox.forEach(lure => {
        const lureType = lure.lure_type || 'Unknown';
        stats.lureTypes[lureType] = (stats.lureTypes[lureType] || 0) + 1;
        stats.totalConfidence += lure.confidence || 0;
      });
      
      stats.averageConfidence = Math.round(stats.totalConfidence / tackleBox.length);
      
      // Get top 5 best performing lures by catch count
      stats.bestPerformingLures = tackleBox
        .filter(lure => lure.catchCount > 0)
        .sort((a, b) => b.catchCount - a.catchCount)
        .slice(0, 5)
        .map(lure => ({
          id: lure.id,
          lure_type: lure.lure_type,
          catchCount: lure.catchCount,
        }));
    }
    
    return stats;
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting tackle box stats:', error);
    }
    return {
      totalLures: 0,
      favoriteLures: 0,
      totalCatches: 0,
      lureTypes: {},
      totalConfidence: 0,
      averageConfidence: 0,
      bestPerformingLures: [],
    };
  }
};
