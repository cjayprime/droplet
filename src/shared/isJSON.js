export default (str) => {
  try {
    const text = JSON.parse(str);
    if (text && typeof text === 'object') {
      return true;
    }
  } catch (e) {
    return false;
  }
  return true;
};
