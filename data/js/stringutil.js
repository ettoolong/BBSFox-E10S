function parseThreadForUserId (str) {
  let regex = new RegExp(/(?:(?:\d+)|(?:  \u2605 )) [\u002bmMsSD*!=~ ](?:(?:[X\d\* ]{2})|(?:\u7206))[\d ]\d\/\d{2} (\w+) +[\u25a1\u8f49\u25c6\u25c7R=]:?/g);
  let result = regex.exec(str);
  if (result && result.length == 2) {
    return result[1].toLowerCase();
  }

  return null;
}

function parsePushthreadForUserId (str) {
  let regex = new RegExp(/[\u2192\u63a8\u5653] (\w+) *:.+ \d{2}\/\d{2} \d{2}:\d{2}/g);
  let result = regex.exec(str);
  if (result && result.length == 2) {
    return result[1].toLowerCase();
  }

  return null;
};
