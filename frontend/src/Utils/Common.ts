export const getShortName = (name: String | null | undefined) => {
  if (!name) return ' ';
  const nameParts = name.trim().replace(/\s\s+/g, ' ').split(' ');
  if (nameParts.length < 2) {
    return nameParts[0].substring(0, 2);
  } else {
    return `${nameParts[0].substring(0, 1)}${nameParts[1].substring(0, 1)}`;
  }
};

// 32 colors
const ColorList = [
  { classBackground: 'u-backgroundNeutral70'},
  { classBackground: 'u-backgroundNeutral50'},
  { classBackground: 'u-backgroundBrown75'},
  { classBackground: 'u-backgroundBrown50'},
  { classBackground: 'u-backgroundRed75'},
  { classBackground: 'u-backgroundRed50'},
  { classBackground: 'u-backgroundOrange75'},
  { classBackground: 'u-backgroundOrange50'},
  { classBackground: 'u-backgroundDeepOrange75'},
  { classBackground: 'u-backgroundDeepOrange50'},
  { classBackground: 'u-backgroundYellow75'},
  { classBackground: 'u-backgroundYellow50'},
  { classBackground: 'u-backgroundLime75'},
  { classBackground: 'u-backgroundLime50'},
  { classBackground: 'u-backgroundGreen75'},
  { classBackground: 'u-backgroundGreen50'},
  { classBackground: 'u-backgroundLightGreen75'},
  { classBackground: 'u-backgroundLightGreen50'},
  { classBackground: 'u-backgroundTeal75'},
  { classBackground: 'u-backgroundTeal50'},
  { classBackground: 'u-backgroundCyan75'},
  { classBackground: 'u-backgroundCyan50'},
  { classBackground: 'u-backgroundBlue75'},
  { classBackground: 'u-backgroundBlue50'},
  { classBackground: 'u-backgroundLightBlue75'},
  { classBackground: 'u-backgroundLightBlue50'},
  { classBackground: 'u-backgroundIndigo70'},
  { classBackground: 'u-backgroundIndigo50'},
  { classBackground: 'u-backgroundPurple75'},
  { classBackground: 'u-backgroundPurple50'},
  { classBackground: 'u-backgroundPink75'},
  { classBackground: 'u-backgroundPink50'},
];

export const chooseColorByString = (name: string | null | undefined) => {
  let total = 0;
  if (!!name) {
    for (let i = 0; i < name.length; i++) {
      total += name.charCodeAt(i);
    }
  }
  const colorIndex = total % ColorList.length;
  return ColorList[colorIndex].classBackground;
};