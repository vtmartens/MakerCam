package com.greenthreads
{
   import flash.utils.getTimer;
   
   public class ThreadStatistics
   {
      
      public var numCycles:int;
      
      public var numTimeouts:int;
      
      public var totalTime:int;
      
      public var times:Array;
      
      public var allocationDifferentials:Array;
      
      private var currentCycleStart:int;
      
      public function ThreadStatistics()
      {
         super();
         this.times = [];
         this.allocationDifferentials = [];
      }
      
      public function startCycle() : void
      {
         this.currentCycleStart = getTimer();
      }
      
      public function endCycle(allocation:int) : void
      {
         var time:Number = getTimer() - this.currentCycleStart;
         this.totalTime += time;
         this.times[this.numCycles] = time;
         this.allocationDifferentials[this.numCycles] = time - allocation;
         ++this.numCycles;
      }
      
      public function recordTimeout() : void
      {
         ++this.numTimeouts;
      }
      
      public function get meanTime() : Number
      {
         return this.totalTime / this.numCycles;
      }
      
      public function get averageDifferential() : Number
      {
         var differential:int = 0;
         var sum:int = 0;
         for each(differential in this.allocationDifferentials)
         {
            sum += differential;
         }
         return sum / this.numCycles;
      }
      
      public function get maxTime() : int
      {
         var time:int = 0;
         var max:int = 0;
         for each(time in this.times)
         {
            max = Math.max(max,time);
         }
         return max;
      }
      
      public function get minTime() : int
      {
         var time:int = 0;
         var min:int = Number.MAX_VALUE;
         for each(time in this.times)
         {
            min = Math.min(min,time);
         }
         return min;
      }
      
      public function print() : String
      {
         return "Total Time: " + this.totalTime + "(ms)" + "\nNumber Of Cycles: " + this.numCycles + "\nMean time per cycle: " + this.meanTime + "(ms)" + "\nMinimum Time, Maximum Time " + this.minTime + "(ms), " + this.maxTime + " (ms)" + "\nAverage Differential: " + this.averageDifferential + "(ms)" + "\nAverage Allocation Diff: " + this.allocationDifferentials + "(ms)" + "\nNumber Of Timeouts: " + this.numTimeouts;
      }
   }
}

