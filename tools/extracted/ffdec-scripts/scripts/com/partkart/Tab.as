package com.partkart
{
   import flash.display.Sprite;
   import flash.geom.Point;
   
   public class Tab extends Sprite
   {
      
      public var location:Number;
      
      public var tabwidth:Number;
      
      public var tabheight:Number;
      
      public var diameter:Number;
      
      public var active:Boolean = false;
      
      public var p1:Point;
      
      public var p2:Point;
      
      public function Tab(inputlocation:Number, inputwidth:Number, inputheight:Number, inputdiameter:Number)
      {
         super();
         this.location = inputlocation;
         this.tabwidth = inputwidth;
         this.tabheight = inputheight;
         this.diameter = inputdiameter;
      }
      
      public function redraw() : void
      {
         graphics.clear();
         if(this.active)
         {
            graphics.beginFill(39423);
         }
         else
         {
            graphics.lineStyle(2,39423,1);
            graphics.beginFill(16777215,0);
         }
         graphics.drawRoundRect(-(this.diameter / 2) * Global.zoom,-(this.tabwidth / 2) * Global.zoom,this.diameter * Global.zoom,this.tabwidth * Global.zoom,this.diameter * Global.zoom);
         graphics.endFill();
      }
      
      public function setActive() : void
      {
         var changed:Boolean = this.active == false;
         this.active = true;
         if(changed)
         {
            this.redraw();
         }
      }
      
      public function setInactive() : void
      {
         var changed:Boolean = this.active == true;
         this.active = false;
         if(changed)
         {
            this.redraw();
         }
      }
   }
}

