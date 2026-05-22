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
        // 연두 (브랜드 메인) - 300(원본)
        brand: {
          50:"#F5FCF2",100:"#E8F9E1",200:"#D2F3C3",300:"#B8EDA1",400:"#9EE67F",
          500:"#7EDE54",600:"#5CD926",700:"#4BB21F",800:"#3B8B18",900:"#2C6812",
        },
        // 하늘 - 400(원본)
        sky: {
          50:"#F2FBFD",100:"#E0F5FA",200:"#C1EAF5",300:"#9EDFF0",400:"#7BD3EA",
          500:"#4FC4E3",600:"#1EB8E1",700:"#1997B8",800:"#137690",900:"#0F586C",
        },
        // 연노랑 (포인트) - 100(원본)
        sun: {
          50:"#FFFEF0",100:"#FFFCDB",200:"#FFFAB8",300:"#FFF78F",400:"#FFF366",
          500:"#FFF033",600:"#FFEC00",700:"#D1C100",800:"#A39700",900:"#7A7100",
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