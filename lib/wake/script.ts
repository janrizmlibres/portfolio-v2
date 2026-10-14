/**
 * Runs in the document's head, after the tier script and before first paint: whether the wake-up plays here, so its
 * loader is the first thing painted. Not without WebGL (the plain page has none), not with `?wake=off`, and not in an
 * automated browser unless the address says `?wake=on`. It marks `<html>`:
 * - `wake` while the wake-up runs, `wake-lock` until the visitor wakes Tycho, `wake-centre` while he's on his stage,
 *   and `wake-still` under reduced motion.
 * The page starts at the top, whatever the browser remembered: a deep link or a reload's place comes after the wake.
 */
export const WAKE_SCRIPT = `(function(){try{
var d=document.documentElement;if(d.dataset.film==="plain")return;
var q=new URLSearchParams(location.search),w=q.get("wake");if(w==="off"||(w!=="on"&&navigator.webdriver))return;
d.classList.add("wake","wake-lock","wake-centre");
if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("wake-still");
if("scrollRestoration" in history)history.scrollRestoration="manual";scrollTo(0,0);
}catch(e){}})()`;
