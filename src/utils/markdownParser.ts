export interface OutdoorActivity {
  id: string;
  name: string;
  dailyTime: string;
  seasonalTime: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
}

export function parseMarkdownActivities(markdownContent: string): OutdoorActivity[] {
  const activities: OutdoorActivity[] = [];
  
  // Split content by sections
  const sections = markdownContent.split('### ');
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the first section (header)
    
    const lines = section.trim().split('\n');
    const activity: Partial<OutdoorActivity> = {};
    let currentField = '';
    let descriptionLines: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Extract activity number and name from first line
      if (lineIndex === 0) {
        const match = trimmedLine.match(/^\d+\.\s*(.+)/);
        if (match) {
          activity.name = match[1].trim();
          activity.id = (activities.length + 1).toString();
        }
      }
      
      // Parse other fields
      if (trimmedLine.startsWith('- **Tên hoạt động:**')) {
        activity.name = trimmedLine.replace('- **Tên hoạt động:**', '').trim();
        currentField = '';
      } else if (trimmedLine.startsWith('- **Thời gian trong ngày:**')) {
        activity.dailyTime = trimmedLine.replace('- **Thời gian trong ngày:**', '').trim();
        currentField = '';
      } else if (trimmedLine.startsWith('- **Thời gian trong năm:**')) {
        activity.seasonalTime = trimmedLine.replace('- **Thời gian trong năm:**', '').trim();
        currentField = '';
      } else if (trimmedLine.startsWith('- **Tọa độ:**')) {
        const coords = trimmedLine.replace('- **Tọa độ:**', '').trim();
        const [lat, lng] = coords.split(',').map(coord => parseFloat(coord.trim()));
        activity.coordinates = { lat, lng };
        currentField = '';
      } else if (trimmedLine.startsWith('- **Mô tả:**')) {
        currentField = 'description';
        // Start collecting description lines
        descriptionLines = [];
      } else if (trimmedLine.startsWith('- **Độ khó:**')) {
        // End description collection and set it
        if (currentField === 'description' && descriptionLines.length > 0) {
          activity.description = descriptionLines.join('\n').trim();
        }
        const difficulty = trimmedLine.replace('- **Độ khó:**', '').trim();
        activity.difficulty = difficulty as 'Easy' | 'Medium' | 'Hard';
        currentField = '';
      } else if (trimmedLine.startsWith('- **Danh mục:**')) {
        // End description collection and set it
        if (currentField === 'description' && descriptionLines.length > 0) {
          activity.description = descriptionLines.join('\n').trim();
        }
        activity.category = trimmedLine.replace('- **Danh mục:**', '').trim();
        currentField = '';
      } else if (currentField === 'description' && trimmedLine) {
        // Collect description lines (skip empty lines at the beginning)
        if (descriptionLines.length > 0 || trimmedLine) {
          descriptionLines.push(trimmedLine);
        }
      }
    });
    
    // Set description if we collected any lines
    if (descriptionLines.length > 0) {
      activity.description = descriptionLines.join('\n').trim();
    }
    
    // Only add if we have the required fields
    if (activity.name && activity.dailyTime && activity.seasonalTime && activity.coordinates) {
      activities.push(activity as OutdoorActivity);
    }
  });
  
  return activities;
}

// Fallback data in case markdown file is not available
export const fallbackActivities: OutdoorActivity[] = [
  {
    id: '1',
    name: 'Leo núi Vũng Chua',
    dailyTime: '6:00 - 16:00',
    seasonalTime: 'Tháng 3 - Tháng 9',
    coordinates: { lat: 13.7667, lng: 109.2333 },
    description: 'Leo núi Vũng Chua với độ cao 400m, ngắm toàn cảnh vịnh Quy Nhơn từ trên cao',
    difficulty: 'Medium',
    category: 'Leo núi'
  },
  {
    id: '2',
    name: 'Đạp xe ven biển Kỳ Co',
    dailyTime: '5:00 - 18:00',
    seasonalTime: 'Quanh năm',
    coordinates: { lat: 13.7833, lng: 109.2833 },
    description: 'Đạp xe dọc bờ biển Kỳ Co với cát trắng mịn và nước biển trong xanh',
    difficulty: 'Easy',
    category: 'Đạp xe'
  }
]; 