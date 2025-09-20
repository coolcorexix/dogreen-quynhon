import { useEffect, useRef, useState } from "react";

function zoomOnScroll(scrollY: number) {
  return scrollY * 0.5;
}

export function ManualHeroBanner() {
  const [scaleBack, setScaleBack] = useState(0);
  const [translateFront, setTranslateFront] = useState(0);
  const handleWheel = (e: WheelEvent) => {
    console.log("scaleBack: ", scaleBack);

    setScaleBack((prev) => {
        const newValue =  prev + e.deltaY * 0.001;
      if (newValue < 0.6) return Math.max(0, newValue);
      return prev;
    });

    setTranslateFront((prev) => Math.max(0, prev + e.deltaY * 0.5));
  };
  return (
    <div
      style={{
        overflowY: "hidden",
        width: "512px",
        height: "512px",
      }}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "512px",
          height: "512px",
          backgroundImage: "url(/images/front.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transform: `translateY(10 - ${translateFront}px)`,
          zIndex: 99,
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          backgroundColor: "black",
          opacity: 0.2,
          width: "512px",
          height: "512px",
          zIndex: 9,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "512px",
          height: "512px",

          backgroundImage: "url(/images/back.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
          transform: `scale(${1 + scaleBack})`,
          transformOrigin: "center",
        }}
      ></div>
    </div>
  );
}
