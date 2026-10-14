#!/bin/zsh
# Builds one of the voyage's models headless in Blender, then compresses it into public/voyage/ (meshopt geometry, WebP
# maps): the station made real (ADR 0013), the relay (ADR 0012), or the traffic round home as Work builds it (ADR 0014)
# (the freighter, hauler, work pod, shuttle and crane ship, the drones and the workers), or the crawler's pipeline (its
# rings, fixtures, the report's bars and the mast's pieces, public/voyage/pipeline/pipeline.glb).
#
#   scripts/models/build.sh station|relay|traffic|pipeline [--raw]
#   scripts/models/build.sh craft|hauler|pod|shuttle|crane|drone|worker --raw   (one of the traffic, for a look)
#
# traffic builds the seven, then merges them into one model (public/voyage/craft/traffic.glb), so the station's maps they
# all wear are carried once.
#
# --raw stops at the uncompressed model in out/, leaving public/ alone. Needs Blender ($BLENDER, else the macOS app),
# python3 with numpy and Pillow for the maps (tex.py, run when tex/ is missing), and npx for gltf-transform. Its maps
# (tex/), raw models and logs (out/) stay out of git. One Blender at a time: on a busy machine, take the heavy lock.
cd ${0:a:h}
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
TRAFFIC=(craft hauler pod shuttle crane drone worker)
if [[ $1 == traffic ]]; then
  for m in $TRAFFIC; do ./build.sh $m --raw || exit 1; done
  [[ $2 == --raw ]] && exit 0
  npx -y @gltf-transform/cli merge out/${^TRAFFIC}.raw.glb out/traffic.raw.glb --merge-scenes > out/traffic-merge.log 2>&1 || { echo "merge failed:"; tail -5 out/traffic-merge.log; exit 1; }
  mkdir -p ../../public/voyage/craft
  npx -y @gltf-transform/cli optimize out/traffic.raw.glb ../../public/voyage/craft/traffic.glb --compress meshopt --texture-compress webp --texture-size 512 \
    --simplify false --join false --flatten false --instance false --palette false > out/traffic-optimize.log 2>&1 || { echo "optimize failed:"; tail -5 out/traffic-optimize.log; exit 1; }
  ls -la ../../public/voyage/craft/traffic.glb | awk '{print $5, $9}'
  exit 0
fi
case $1 in
  station) script=station.py; vars=(MODE=site); raw=out/real.raw.glb; dest=ship/real.glb; size=1024 ;;
  relay) script=relay.py; vars=(MODE=site VARIANT=barrel); raw=out/relay.raw.glb; dest=relay/relay.glb; size=1024 ;;
  craft|hauler|pod|shuttle|crane|drone|worker) script=$1.py; vars=(CRAFT_MODE=site); raw=out/$1.raw.glb; dest=craft/$1.glb; size=512 ;;
  pipeline) script=pipeline.py; vars=(MODE=site); raw=out/pipeline.raw.glb; dest=pipeline/pipeline.glb; size=512 ;;
  *) echo "usage: scripts/models/build.sh station|relay|traffic|pipeline [--raw], or craft|hauler|pod|shuttle|crane|drone|worker --raw"; exit 2 ;;
esac
[[ -f tex/blanket-color.png ]] || python3 tex.py || exit 1
mkdir -p out
env $vars $BLENDER -b --factory-startup --python $script > out/$1.log 2>&1
if grep -q "Traceback" out/$1.log || [[ ! -f $raw ]]; then echo "blender failed (out/$1.log):"; grep -A12 "Traceback" out/$1.log | head -20; exit 1; fi
echo "built $raw"
[[ $2 == --raw ]] && exit 0
# the station's build times (_BUILD, 0..1) as 8 bits: optimize leaves custom attributes as floats, which compress badly
src=$raw
if [[ $1 == station ]]; then
  src=out/$1.q.glb
  npx -y @gltf-transform/cli quantize $raw $src --pattern "_BUILD" --quantize-generic 8 > out/$1-quantize.log 2>&1 || { echo "quantize failed:"; tail -5 out/$1-quantize.log; exit 1; }
fi
mkdir -p ../../public/voyage/${dest:h}
npx -y @gltf-transform/cli optimize $src ../../public/voyage/$dest --compress meshopt --texture-compress webp --texture-size $size \
  --simplify false --join false --flatten false --instance false --palette false > out/$1-optimize.log 2>&1 || { echo "optimize failed:"; tail -5 out/$1-optimize.log; exit 1; }
ls -la $raw ../../public/voyage/$dest | awk '{print $5, $9}'
