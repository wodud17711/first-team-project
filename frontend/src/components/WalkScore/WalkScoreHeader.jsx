// 위치 아이콘
import locationIcon from '../../assets/locationIcon.png'


// location 은 현재 데모 고정(부산). 추후 사용자 위치/날씨 지역 배선 시 prop 으로 주입.
function WalkScoreHeader({ title, desc, location = '부산광역시' }) {
  return (
    <div className="flex flex-col items-start justify-between mb-6">

      <div className='flex items-center gap-2'>
        <img src={locationIcon} className='w-4 h-4' />
        <span className="text-[14px] text-txtcolor-500 font-bold">
          {location}
        </span>
      </div>

      <div className='mt-2'>
        <h2 className="text-[32px] font-bold">
          {title}
        </h2>
        <p className="text-[14px] text-txtcolor-500 mt-1">
          {desc}
        </p>
      </div>

    </div>
  )
}
export default WalkScoreHeader