/** @type {import('tailwindcss').Config} */

// 기존에 있던 내용물
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         brand: {
//           50: "#fff7ed",
//           500: "#f97316",
//           600: "#ea580c",
//         },
//       },
//     },
//   },
//   plugins: [],
// }


// 추후 색상 변경 가능 있음
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 연두 (브랜드 메인) - 500(원본)
        brand: {
          50:  "#F6FDF1",
          100: "#EAF9D8",
          200: "#D6F3B3",
          300: "#BFEA88",
          400: "#A8E15E",
          500: "#ADE844", // base
          600: "#8FCC36",
          700: "#6FA52A",
          800: "#4F7A1F",
          900: "#355417",
        },
        // 하늘 - 400(원본)
        sky: {
          50:  "#F2F8FE",
          100: "#DDECFB",
          200: "#C4DFFC",
          300: "#A3CCF7",
          400: "#7CB3F0", // base
          500: "#5A9EE6",
          600: "#3F82D1",
          700: "#2F66A8",
          800: "#234D7D",
          900: "#1A3659",
        },
        // 연노랑 (포인트) - 100(원본)
        sun: {
          50:  "#FFFFF5",
          100: "#FFFFE3", // base
          200: "#FFF7C8",
          300: "#FFEE9E",
          400: "#FFE56E",
          500: "#FFD94A",
          600: "#E6BE2E",
          700: "#B89622",
          800: "#8A6F19",
          900: "#5C4A10",
        },
        // 기본 폰트 색상
        txtcolor:{
          50: "#FCFDF8", 100: "#E8E9E0", 200: "#CED0C4", 300: "#B4B6A8", 400: "#919486", 
          500: "#6E7363", 600: "#565C4B", 700: "#3D4433", 800: "#2E3425", 900: "#1F2417",
        },
        // 위험도 의미색
        success: "#22C55E",  // 안전
        warning: "#FFD93D",  // 주의
        danger:  "#EF4444",  // 위험
      },
    },
  },
  plugins: [],
}