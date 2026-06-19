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
        // 🌟 브랜드 (노랑 메인)
        brand: {
          50:  "#FFFDF2",
          100: "#FFF6CC",
          200: "#FFEB99",
          300: "#FFE066",
          400: "#FFD54D",
          500: "#FCCD47", // base
          600: "#E6B92F",
          700: "#C49B22",
          800: "#9C7A19",
          900: "#6E5511",
        },

        // 🌊 스카이 (브랜드 + 다크 텍스트와 균형 맞춘 차분한 블루)
        sky: {
          50:  "#F3F8FF",
          100: "#DCEBFF",
          200: "#B9D7FF",
          300: "#8FBFFF",
          400: "#5FA3F5",
          500: "#3C86E6", // base (너무 튀지 않는 블루)
          600: "#2F6CC2",
          700: "#24559A",
          800: "#1C4173",
          900: "#142C4D",
        },

        // 🌿 그린 (기존 sun → 상태/포인트용 green)
        green: {
          50:  "#F3FBF5",
          100: "#DCF6E3",
          200: "#B9EBC8",
          300: "#8DDD9F",
          400: "#5FCD74",
          500: "#36B85A", // base
          600: "#2C9A49",
          700: "#237C3B",
          800: "#1A5E2D",
          900: "#124121",
        },

        // 🖤 텍스트 (고정)
        txtcolor: {
          50: "#F7F6F5",
          100: "#E2DFDD",
          200: "#C7C2BE",
          300: "#A9A29D",
          400: "#8C847F",
          500: "#6F6762",
          600: "#5A534F",
          700: "#403D3A", // base
          800: "#2F2C2A",
          900: "#1F1D1C",
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