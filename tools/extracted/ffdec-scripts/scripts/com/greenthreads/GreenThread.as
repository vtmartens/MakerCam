package com.greenthreads
{
   import flash.display.Sprite;
   import flash.errors.ScriptTimeoutError;
   import flash.events.Event;
   import flash.events.ProgressEvent;
   import flash.utils.getTimer;
   
   public class GreenThread extends Sprite
   {
      
      protected var _maximum:Number = NaN;
      
      protected var _progress:Number = NaN;
      
      private var _debug:Boolean;
      
      private var _statistics:ThreadStatistics;
      
      public function GreenThread(debug:Boolean = true)
      {
         super();
         this._debug = debug;
      }
      
      final public function start(share:Number = 0.99) : void
      {
         ThreadProcessor.stage = this.stage;
         ThreadProcessor.getInstance(share).addThread(this);
         if(this.debug)
         {
            this._statistics = new ThreadStatistics();
         }
         this.initialize();
      }
      
      final public function stop() : void
      {
         ThreadProcessor.getInstance().stop(this);
      }
      
      protected function initialize() : void
      {
      }
      
      protected function run() : Boolean
      {
         return false;
      }
      
      final public function execute(processAllocation:Number) : Boolean
      {
         var processStart:int = 0;
         var loop:Boolean = false;
         if(this.debug)
         {
            this.statisitcs.startCycle();
         }
         try
         {
            processStart = getTimer();
            loop = true;
            while(getTimer() - processStart < processAllocation && loop)
            {
               loop = this.run();
            }
         }
         catch(error:ScriptTimeoutError)
         {
            if(debug)
            {
               statisitcs.recordTimeout();
            }
            dispatchEvent(new ThreadEvent(ThreadEvent.TIMEOUT));
         }
         if(this.debug)
         {
            this.statisitcs.endCycle(processAllocation);
         }
         if(!loop)
         {
            this.dispatchProgress();
            dispatchEvent(new Event(Event.COMPLETE));
            this.stop();
            return false;
         }
         this.dispatchProgress();
         return true;
      }
      
      private function dispatchProgress() : void
      {
         var evt:ProgressEvent = null;
         if(isNaN(this.maximum) == false)
         {
            evt = new ProgressEvent(ProgressEvent.PROGRESS);
            evt.bytesLoaded = this.progress;
            evt.bytesTotal = this.maximum;
            dispatchEvent(evt);
         }
      }
      
      public function get progress() : Number
      {
         return this._progress;
      }
      
      public function get maximum() : Number
      {
         return this._maximum;
      }
      
      public function set maximum(value:Number) : void
      {
         this._maximum = value;
      }
      
      public function set progress(value:Number) : void
      {
         this._progress = value;
      }
      
      public function get debug() : Boolean
      {
         return this._debug;
      }
      
      public function set debug(value:Boolean) : void
      {
         this._debug = value;
      }
      
      public function get statisitcs() : ThreadStatistics
      {
         return this._statistics;
      }
   }
}

