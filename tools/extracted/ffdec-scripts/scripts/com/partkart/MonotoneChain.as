package com.partkart
{
   public dynamic class MonotoneChain extends Array
   {
      
      public var frontindex:int = 0;
      
      public var frontvalue:Number;
      
      public var reversed:Boolean = false;
      
      public function MonotoneChain(... args)
      {
         var arg:* = undefined;
         super();
         for each(arg in args)
         {
            super.push(arg);
         }
      }
   }
}

