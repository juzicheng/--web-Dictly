const criticalStyleId = "dictly-critical-css";
const cssHrefPattern = /\.css(?:[?#].*)?$/i;
const criticalStylePattern = new RegExp(
  `<style\\b(?=[^>]*\\bid=(["'])${criticalStyleId}\\1)[^>]*>[\\s\\S]*?<\\/style>`,
  "i",
);
const stylesheetLinkPattern = /<link\b[^>]*\brel=(["'])stylesheet\1[^>]*>/gi;

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"));
  return match?.[2] ?? "";
}

function hasAttribute(tag: string, name: string) {
  return new RegExp(`\\s${name}(?:=|\\s|>|/)`, "i").test(tag);
}

function appendAttribute(tag: string, attribute: string) {
  const closing = tag.endsWith("/>") ? "/>" : ">";
  return `${tag.replace(/\s*\/?>$/, "")} ${attribute}${closing}`;
}

function toAsyncStylesheet(linkTag: string) {
  const href = getAttribute(linkTag, "href");

  if (!href || !cssHrefPattern.test(href)) {
    return linkTag;
  }

  let asyncLink = linkTag.replace(/\srel=(["'])stylesheet\1/i, ' rel="preload"');

  if (!hasAttribute(asyncLink, "as")) {
    asyncLink = appendAttribute(asyncLink, 'as="style"');
  }

  if (!hasAttribute(asyncLink, "onload")) {
    asyncLink = appendAttribute(asyncLink, 'onload="this.onload=null;this.rel=\'stylesheet\'"');
  }

  return `${asyncLink}<noscript>${linkTag}</noscript>`;
}

function asyncStylesheets(markup: string) {
  return markup.replace(stylesheetLinkPattern, toAsyncStylesheet);
}

function moveCriticalStyleToHeadStart(markup: string) {
  const match = markup.match(criticalStylePattern);

  if (!match?.[0] || match.index === undefined || match.index === 0) {
    return markup;
  }

  return `${match[0]}${markup.slice(0, match.index)}${markup.slice(match.index + match[0].length)}`;
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (htmlContext) => {
    const headMarkup = htmlContext.head.join("");
    htmlContext.head = [moveCriticalStyleToHeadStart(asyncStylesheets(headMarkup))];
  });
});
