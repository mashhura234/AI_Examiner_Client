// src/Services/commonServices.ts

export const CommonService = {
  // Convert JS objects & file uploads (like photos of complaints) into FormData for the backend
  buildFormData: (data: any, formData = new FormData(), parentKey = ''): FormData => {
    if (data === null || data === undefined) return formData;

    if (data instanceof File) {
      formData.append(parentKey, data);
      return formData;
    }

    if (Array.isArray(data)) {
      data.forEach((value, index) => {
        const key = `${parentKey}[${index}]`;
        CommonService.buildFormData(value, formData, key);
      });
      return formData;
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      Object.keys(data).forEach((key) => {
        const value = data[key];
        const formKey = parentKey ? `${parentKey}.${key}` : key;
        CommonService.buildFormData(value, formData, formKey);
      });
      return formData;
    }

    formData.append(parentKey, data.toString());
    return formData;
  },

  // Format date for displays (e.g., "Mon, 21/07/2026, 01:44 PM")
  FormatExactDate: (dateTimeString: string) => {
    if (!dateTimeString) return "";
    const [datePart, timePart] = dateTimeString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = (timePart || "00:00:00").split(":").map(Number);

    const jsDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = weekdays[jsDate.getDay()];

    let hh = hour;
    let suffix = "AM";
    if (hh >= 12) {
      suffix = "PM";
      if (hh > 12) hh -= 12;
    }
    if (hh === 0) hh = 12;

    const dd = String(day).padStart(2, "0");
    const mm = String(month).padStart(2, "0");
    const yyyy = year;
    const h = String(hh).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    const s = String(second).padStart(2, "0");

    return `${weekday}, ${dd}/${mm}/${yyyy}, ${h}:${m}:${s} ${suffix}`;
  },

  Delay: (ms: number) => new Promise(res => setTimeout(res, ms)),

  // Save data safely into browser localStorage
  SaveDataToSession: (obj: any) => {
    if (!obj) return;
    for (const key in obj) {
      const val = obj[key];
      if (val !== null && val !== undefined) {
        localStorage.setItem(
          key,
          typeof val === "object" ? JSON.stringify(val) : String(val)
        );
      }
    }
  },

  // Clear session on logout
  ClearSession: () => {
    localStorage.clear();
  },

  IsEmptyValueInForm: (formObject: Record<string, any>, ignoredKeys: string[] = []): boolean => {
    for (const key in formObject) {
      if (ignoredKeys.includes(key)) continue;

      const value = formObject[key];
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return true; // Found an empty value
      }
    }
    return false; // All non-ignored fields are valid
  },

  GetSessionValByKey: (key: string) => {
    return localStorage.getItem(key);
  },

  // Helpers to get JWT tokens from localStorage
  GetUserToken() {
    return CommonService.GetSessionValByKey("accessToken");
  },

  GetRefreshToken() {
    return CommonService.GetSessionValByKey("refreshToken");
  },

  IsAuthenticated() {
    return CommonService.GetSessionValByKey("accessToken") ? true : false;
  }
};