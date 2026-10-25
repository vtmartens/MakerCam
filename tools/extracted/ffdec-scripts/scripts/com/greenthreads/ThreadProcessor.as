package com.greenthreads
{
   import flash.events.Event;
   import flash.utils.getTimer;
   
   public class ThreadProcessor
   {
      
      private static var _instance:ThreadProcessor;
      
      public static var stage:*;
      
      private static const EPSILON:int = 1;
      
      private var frameRate:int;
      
      private var _share:Number;
      
      private var activeThreads:Array;
      
      private var errorTerm:int;
      
      public function ThreadProcessor(share:Number = 0.99)
      {
         super();
         if(!_instance)
         {
            this.frameRate = stage.frameRate;
            this.share = share;
            this.activeThreads = null;
            _instance = this;
            return;
         }
         throw new Error("Error: Instantiation failed: Use ThreadProcessor.getInstance() instead of new.");
      }
      
      public static function getInstance(share:Number = 0.99) : ThreadProcessor
      {
         if(!_instance)
         {
            _instance = new ThreadProcessor(share);
         }
         return _instance;
      }
      
      public function addThread(thread:GreenThread) : void
      {
         if(!this.activeThreads)
         {
            this.activeThreads = [];
            this.start();
         }
         this.activeThreads.push(thread);
      }
      
      private function start() : void
      {
         stage.addEventListener(Event.ENTER_FRAME,this.doCycle);
      }
      
      public function stop(thread:GreenThread) : void
      {
         var index:int = this.activeThreads.indexOf(thread);
         if(index >= 0)
         {
            this.activeThreads.splice(index,1);
         }
         if(this.activeThreads.length == 0)
         {
            this.stopAll();
         }
      }
      
      public function stopAll() : void
      {
         this.activeThreads = null;
         stage.removeEventListener(Event.ENTER_FRAME,this.doCycle);
      }
      
      private function doCycle(event:Event) : void
      {
         var process:GreenThread = null;
         var timeAllocation:int = this.share < 1 ? int(this.timerDelay * this.share + 1) : int(this.frameRate - this.share);
         timeAllocation = Math.max(timeAllocation,EPSILON * this.activeThreads.length);
         if(this.errorTerm > timeAllocation - 1)
         {
            this.errorTerm = 0;
            return;
         }
         var cycleStart:int = getTimer();
         var cycleAllocation:int = timeAllocation - this.errorTerm;
         var processAllocation:int = cycleAllocation / this.activeThreads.length;
         for(var i:* = int(this.activeThreads.length - 1); i > -1; i--)
         {
            process = this.activeThreads[i] as GreenThread;
            if(!process.execute(processAllocation))
            {
               if(!this.activeThreads)
               {
                  break;
               }
               processAllocation = cycleAllocation / this.activeThreads.length;
            }
         }
         var cycleTime:int = getTimer() - cycleStart;
         var delta:Number = cycleTime - timeAllocation;
         this.errorTerm = this.errorTerm + delta >> 1;
      }
      
      public function get timerDelay() : Number
      {
         return 1000 / this.frameRate;
      }
      
      public function get share() : Number
      {
         return this._share;
      }
      
      public function set share(percent:Number) : void
      {
         this._share = percent;
      }
   }
}

