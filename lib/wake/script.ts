/**
 * Runs in the document's head, after the tier script and before first paint: whether the wake-up plays here, so its
 * loader is the first thing painted. Not without WebGL (the plain page has none), not with `?wake=off`, and not in an
 * automated browser unless the address says `?wake=on`. It marks `<html>`:
 * - `wake` while the wake-up runs, `wake-lock` until the visitor wakes Tycho, `wake-centre` while he's on his stage,
 *   and `wake-still` under reduced motion;
 * - `wake-switch`, in place of `wake-centre`, on the load a switch between lite and the film made (`markSwitched`):
 *   the loader still builds the voyage, then the page is the visitor's at once, Tycho in his corner, with no charge-up
 *   and no button. The mark is read and cleared on the first load after it, whether the wake-up plays there or not.
 * The page starts at the top, whatever the browser remembered: a deep link or a reload's place comes after the wake.
 */
const SWITCHED = "jrz-switched";

/** The next load is a switch between lite and the film (lib/film/lite.ts): it skips the wake-up's charge-up. */
export function markSwitched() {
  try {
    sessionStorage.setItem(SWITCHED, "1");
  } catch {}
}

export const WAKE_SCRIPT = `(function(){try{
var d=document.documentElement,s=false;try{s=sessionStorage.getItem("${SWITCHED}")!==null;sessionStorage.removeItem("${SWITCHED}")}catch(e){}
if(d.dataset.film==="plain")return;
var q=new URLSearchParams(location.search),w=q.get("wake");if(w==="off"||(w!=="on"&&navigator.webdriver))return;
d.classList.add("wake","wake-lock",s?"wake-switch":"wake-centre");
if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("wake-still");
if("scrollRestoration" in history)history.scrollRestoration="manual";scrollTo(0,0);
}catch(e){}})()`;
