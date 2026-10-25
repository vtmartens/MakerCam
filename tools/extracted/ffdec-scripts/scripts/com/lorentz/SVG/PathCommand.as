package com.lorentz.SVG
{
   public class PathCommand
   {
      
      public var type:String;
      
      public var _args:Array;
      
      public var extra:Object;
      
      public function PathCommand(type:String = null, args:Array = null)
      {
         super();
         this.type = type;
         this._args = args;
      }
      
      public function get args() : Array
      {
         if(this._args == null)
         {
            this._args = new Array();
         }
         return this._args;
      }
      
      public function set args(value:*) : void
      {
         this._args = value;
      }
   }
}

