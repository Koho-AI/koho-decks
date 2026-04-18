import { ChevronRight } from 'lucide-react'
import React from 'react'

const ModeSelectStep = ({ setStep, setSelectedMode }: { setStep: (step: number) => void, setSelectedMode: (mode: string) => void }) => {
    return (
        <div className='max-w-[650px]'>
            <div className='mb-[70px]'>

                <h2 className='mb-4 text-black text-[26px] font-normal font-unbounded '>Let’s set up your AI workspace</h2>
                <p className='text-[#000000CC] text-xl font-normal font-syne'>First, choose the intelligence behind your presentation generation.</p>
            </div>
            <div className='space-y-5'>
                <div onClick={() => {
                    setSelectedMode("presenton")
                    setStep(2)
                }} className='border font-syne border-[#EDEEEF] rounded-[11px] p-3  flex items-center  justify-between gap-6 cursor-pointer'>
                    <div className='flex items-center gap-6'>
                        <div className='rounded-[4px] bg-[#E6FBF1] p-[12px] w-[58px] h-[58px] flex items-center justify-center'>
                            <svg width="34" height="34" viewBox="0 0 146 146" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.28" d="M69.7283 2.00867C97.5808 -1.2363 128.528 18.2335 137.812 49.0607C147.096 79.8879 133.17 112.338 103.77 125.317C75.9177 138.297 38.7811 131.807 17.1181 110.715C-4.54491 89.6228 -4.54491 52.3057 10.9287 27.9684C26.4023 3.63115 41.8758 5.25364 69.7283 2.00867Z" fill="#00C278"/>
                                <path opacity="0.52" d="M79.0125 26.3459C99.1626 23 119.244 36.0809 122.339 58.7956C125.433 81.5104 113.054 102.603 92.9387 109.093C72.8231 115.583 51.16 105.848 41.8759 88.0003C32.5917 70.153 37.2338 47.4382 52.7074 36.0809C63.5389 27.9684 69.6626 27.5 79.0125 26.3459Z" fill="#00C278"/>
                                <path opacity="0.7" d="M83.6546 52.3056C96.6626 49.5 108.412 55.5506 109.96 71.7754C111.507 88.0003 100.676 99.3577 86.7494 100.98C72.8231 102.603 60.4443 92.8677 58.8969 78.2654C57.3495 63.663 65.9169 56.1315 83.6546 52.3056Z" fill="#00C278"/>
                                <path d="M86.7821 57.6665C94.6626 56.5 100.825 59.8486 101.699 69.2115C102.572 78.5745 99.1428 83.7302 91.2821 84.6665C83.4214 85.6028 74.6555 80.0931 73.7821 71.6665C72.9087 63.2399 76.7821 58.6665 86.7821 57.6665Z" fill="#00C278"/>
                            </svg>
                        </div>
                        <div className=''>
                            <div className='flex items-start gap-2 relative '>

                                <h3 className='text-black text-[18px] font-medium font-syne'>Koho Decks</h3>
                                <p className='bg-[#F4F3FF] px-3 py-1.5 rounded-[30px] text-[#7A5AF8] text-[9px] absolute left-[95px] top-[-10px]'>PPTX</p>
                            </div>
                            <p className='text-[#999999] text-[14px] font-normal font-syne'>Optimized for fast, structured slide generation.</p>
                        </div>
                    </div>
                    <ChevronRight className='w-6 h-6 text-[#B3B3B3]' />
                </div>
                <div

                    // onClick={() => {
                    //     setSelectedMode("image")
                    //     setStep(2)
                    // }}
                    className='border font-syne border-[#EDEEEF]  cursor-not-allowed rounded-[11px] p-3  flex items-center  justify-between gap-6  relative'>
                    <p className='text-black absolute top-1/2 -translate-y-1/2 right-14 flex items-center justify-center text-[14px] font-normal bg-[#F4F3FF] px-3 py-1.5 rounded-[30px]'>Coming soon</p>

                    <div className='flex items-center gap-6'>
                        <div className='rounded-[4px] bg-[#FFF6ED]  p-[12px] w-[58px] h-[58px] flex items-center justify-center'>
                            <img src='/image_mode.png' alt='presenton' className='w-full h-full object-contain' />
                        </div>
                        <div className=''>
                            <div className='flex items-start gap-2 relative '>

                                <h3 className='text-black text-[18px] font-medium font-syne'>Generate with Image Model</h3>

                            </div>
                            <p className='text-[#999999] text-[14px] font-normal font-syne'>Generate presentations with visual layouts and elements.</p>
                        </div>
                    </div>
                    <ChevronRight className='w-6 h-6 text-[#B3B3B3]' />
                </div>
            </div>
        </div>
    )
}

export default ModeSelectStep
