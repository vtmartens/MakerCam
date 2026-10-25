package com.greenthreads
{
   import flash.events.Event;
   
   public class ThreadEvent extends Event
   {
      
      public static const TIMEOUT:String = "timeout";
      
      private var _thread:GreenThread;
      
      public function ThreadEvent(type:String, thread:GreenThread = null, bubbles:Boolean = false, cancelable:Boolean = false)
      {
         super(type,bubbles,cancelable);
         this._thread = thread;
      }
      
      public function get thread() : GreenThread
      {
         return this._thread;
      }
   }
}

