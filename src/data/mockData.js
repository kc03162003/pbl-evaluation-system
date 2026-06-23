const defaultData = [];

let customData = localStorage.getItem('customStudentsData');
if (customData) {
  try {
    const parsed = JSON.parse(customData);
    if (parsed.some(s => s.name !== undefined)) {
      localStorage.removeItem('customStudentsData');
      customData = null;
    }
  } catch(e) {
    localStorage.removeItem('customStudentsData');
    customData = null;
  }
}

export const STUDENTS_DATA = customData ? JSON.parse(customData) : defaultData;
