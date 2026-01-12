/**
 * Utility functions for generating month separator borders in the workout history grid
 */

export interface BorderSides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface BorderCorners {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

export interface DayBorderInfo {
  sides: BorderSides;
  corners: BorderCorners;
}

/**
 * Gets the month/year for a date, returns null if date is invalid
 */
function getMonthYear(date: Date | null | undefined): { month: number; year: number } | null {
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  return { month: date.getMonth(), year: date.getFullYear() };
}

/**
 * Determines which border sides should be drawn for a day square based on month boundaries
 */
export function getMonthBorderInfo(
  date: Date | null | undefined,
  weekIndex: number,
  dayIndex: number,
  weeksData: Array<Array<{ date: Date; dateString: string; totalReps: number }>>
): DayBorderInfo | null {
  // Skip if date is invalid or empty
  const currentMonthYear = getMonthYear(date);
  if (!currentMonthYear) {
    return null;
  }

  const { month: currentMonth, year: currentYear } = currentMonthYear;

  // Get adjacent days
  const dayAbove = weekIndex > 0 ? weeksData[weekIndex - 1]?.[dayIndex] : null;
  const dayBelow = weekIndex < weeksData.length - 1 ? weeksData[weekIndex + 1]?.[dayIndex] : null;
  const dayLeft = dayIndex > 0 ? weeksData[weekIndex]?.[dayIndex - 1] : null;
  const dayRight = dayIndex < 6 ? weeksData[weekIndex]?.[dayIndex + 1] : null;

  // Check if adjacent days are in different months
  const monthAbove = getMonthYear(dayAbove?.date);
  const monthBelow = getMonthYear(dayBelow?.date);
  const monthLeft = getMonthYear(dayLeft?.date);
  const monthRight = getMonthYear(dayRight?.date);

  // Determine border sides based on month boundaries
  const sides: BorderSides = {
    // Top border: if day above is in different month or doesn't exist
    top: !monthAbove || 
         monthAbove.month !== currentMonth || 
         monthAbove.year !== currentYear,
    // Right border: if day to the right is in different month or doesn't exist
    right: !monthRight || 
           monthRight.month !== currentMonth || 
           monthRight.year !== currentYear,
    // Bottom border: if day below is in different month or doesn't exist
    bottom: !monthBelow || 
            monthBelow.month !== currentMonth || 
            monthBelow.year !== currentYear,
    // Left border: if day to the left is in different month or doesn't exist
    left: !monthLeft || 
          monthLeft.month !== currentMonth || 
          monthLeft.year !== currentYear,
  };

  // Determine rounded corners (only on outer corners of the month block)
  const corners: BorderCorners = {
    topLeft: sides.top && sides.left,
    topRight: sides.top && sides.right,
    bottomLeft: sides.bottom && sides.left,
    bottomRight: sides.bottom && sides.right,
  };

  return { sides, corners };
}

/**
 * Generates CSS classes for month separator borders
 * @param borderInfo - The border information for the day
 * @param date - The date of the day (to determine which month it belongs to)
 * @param currentMonth - The current month (0-11)
 * @param currentYear - The current year
 */
export function getMonthBorderClasses(
  borderInfo: DayBorderInfo | null,
  date: Date | null | undefined,
  currentMonth: number,
  currentYear: number
): string {
  if (!borderInfo) {
    return '';
  }

  const classes: string[] = [];
  const { sides, corners } = borderInfo;

  // Determine border color based on which month the day belongs to
  let borderColor: string;
  const dayMonthYear = getMonthYear(date);
  const isCurrentMonth = dayMonthYear && 
    dayMonthYear.month === currentMonth && 
    dayMonthYear.year === currentYear;

  if (isCurrentMonth) {
    // Current month: light purple
    borderColor = 'border-purple-300 dark:border-purple-600';
  } else {
    // Last month: light orange
    borderColor = 'border-orange-300 dark:border-orange-600';
  }

  // Only add border classes if we have at least one border
  if (sides.top || sides.right || sides.bottom || sides.left) {
    // Use individual border classes for better control
    if (sides.top) classes.push('border-t');
    if (sides.right) classes.push('border-r');
    if (sides.bottom) classes.push('border-b');
    if (sides.left) classes.push('border-l');

    classes.push(borderColor);

    // Handle rounded corners (only apply rounding where we have corners)
    const cornerClasses: string[] = [];
    if (corners.topLeft) cornerClasses.push('rounded-tl-md');
    if (corners.topRight) cornerClasses.push('rounded-tr-md');
    if (corners.bottomLeft) cornerClasses.push('rounded-bl-md');
    if (corners.bottomRight) cornerClasses.push('rounded-br-md');
    
    classes.push(...cornerClasses);
  }

  return classes.join(' ');
}
