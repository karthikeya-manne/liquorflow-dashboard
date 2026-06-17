export default function PageLoader() {

    return (
  
      <div className="
        min-h-screen
        bg-black
        flex
        flex-col
        items-center
        justify-center
        gap-6
      ">
  
        <img
          src="/logo-full.png"
          alt="LiquorFlow"
          className="w-[500px] max-w-[90%] object-contain"
        />
  
        <div
          className="
            w-12
            h-12
            border-4
            border-orange-500
            border-t-transparent
            rounded-full
            animate-spin
          "
        />
  
      </div>
  
    );
  
  }