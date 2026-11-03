/** Ignore only sparse one-level GPU rounding; real geometry/palette changes fail. */
export async function visualDifference(page, first, second) {
  return page.evaluate(
    async ({ a, b }) => {
      async function decode(value) {
        const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
        const bitmap = await createImageBitmap(
          new Blob([bytes], { type: "image/png" }),
        );
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return {
          width: canvas.width,
          height: canvas.height,
          pixels: context.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      }
      const x = await decode(a),
        y = await decode(b);
      const sameSize = x.width === y.width && x.height === y.height;
      if (!sameSize) return { sameSize, maxChannelDelta: 255, changedRatio: 1 };
      let maxChannelDelta = 0,
        changed = 0;
      for (let i = 0; i < x.pixels.length; i += 4) {
        let different = false;
        for (let c = 0; c < 4; c++) {
          const delta = Math.abs(x.pixels[i + c] - y.pixels[i + c]);
          if (delta) different = true;
          maxChannelDelta = Math.max(maxChannelDelta, delta);
        }
        if (different) changed++;
      }
      return {
        sameSize,
        maxChannelDelta,
        changedPixels: changed,
        changedRatio: changed / (x.width * x.height),
      };
    },
    { a: first.toString("base64"), b: second.toString("base64") },
  );
}
