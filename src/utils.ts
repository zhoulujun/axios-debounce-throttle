/**
 * 获取Cookie
 * @param {String} name
 */
export const getCookie = (name: string) => {
  const reg = new RegExp(`(^|)${name}=([^;]*)(;|$)`);
  const data = document.cookie.match(reg);
  if (data) {
    return unescape(data[2]);
  }
  return null;
};
