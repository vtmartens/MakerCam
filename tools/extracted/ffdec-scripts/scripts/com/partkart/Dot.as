package com.partkart
{
   import flash.display.*;
   import flash.geom.Point;
   
   public class Dot extends Sprite
   {
      
      public var s1:Segment;
      
      public var s2:Segment;
      
      public var point:Point;
      
      public var c1:Segment;
      
      public var c2:Segment;
      
      public var active:Boolean;
      
      public var current:Boolean = false;
      
      public var loop:Boolean = false;
      
      public var looppoint:Point;
      
      public var looppath:Path;
      
      private var loopshape:Shape;
      
      private var hitshape:Shape;
      
      public function Dot()
      {
         super();
         this.setInactive();
      }
      
      public function setActive() : void
      {
         this.active = true;
         this.clearChildren();
         var dot1:* = new Shape();
         dot1.graphics.beginFill(0);
         dot1.graphics.drawRect(0,0,30,30);
         dot1.graphics.endFill();
         dot1.x = -15;
         dot1.y = -15;
         dot1.alpha = 0;
         var dot3:* = new Shape();
         dot3.graphics.beginFill(16711680);
         dot3.graphics.drawCircle(0,0,5);
         dot3.graphics.endFill();
         var dotsprite:Sprite = new Sprite();
         addChild(dot1);
         addChild(dot3);
      }
      
      public function setInactive() : void
      {
         this.active = false;
         this.clearChildren();
         var dot1:* = new Shape();
         dot1.graphics.beginFill(0);
         dot1.graphics.drawRect(0,0,30,30);
         dot1.graphics.endFill();
         dot1.x = -15;
         dot1.y = -15;
         dot1.alpha = 0;
         var dot2:* = new Shape();
         dot2.graphics.beginFill(0);
         dot2.graphics.drawCircle(0,0,5);
         dot2.graphics.endFill();
         var dot3:* = new Shape();
         dot3.graphics.beginFill(16711680);
         dot3.graphics.drawCircle(0,0,3);
         dot3.graphics.endFill();
         var dotsprite:Sprite = new Sprite();
         addChild(dot1);
         addChild(dot2);
         addChild(dot3);
      }
      
      public function setLoop() : void
      {
         this.loop = true;
         if(this.loopshape == null || this.loopshape != null && !contains(this.loopshape))
         {
            this.loopshape = new Shape();
            this.loopshape.graphics.beginFill(16711680);
            this.loopshape.graphics.drawCircle(0,0,15);
            this.loopshape.graphics.drawCircle(0,0,13);
            this.loopshape.graphics.endFill();
            addChild(this.loopshape);
         }
      }
      
      public function unsetLoop() : void
      {
         this.loop = false;
         if(this.loopshape != null && contains(this.loopshape))
         {
            removeChild(this.loopshape);
         }
      }
      
      private function clearChildren() : void
      {
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
      }
      
      public function setCurrent() : void
      {
         this.current = true;
      }
      
      public function unsetCurrent() : void
      {
         this.current = false;
      }
      
      public function setDragging() : void
      {
         if(this.hitshape == null || this.hitshape != null && !contains(this.hitshape))
         {
            this.hitshape = new Shape();
            this.hitshape.graphics.beginFill(16711680);
            this.hitshape.graphics.drawCircle(0,0,80);
            this.hitshape.graphics.endFill();
            this.hitshape.alpha = 0;
            addChild(this.hitshape);
         }
      }
      
      public function unsetDragging() : void
      {
         if(this.hitshape != null && contains(this.hitshape))
         {
            removeChild(this.hitshape);
         }
      }
      
      public function setSketch() : void
      {
         this.clearChildren();
         var sketchshape:Shape = new Shape();
         sketchshape.graphics.beginFill(16768256);
         sketchshape.graphics.drawCircle(0,0,22);
         sketchshape.graphics.endFill();
         addChild(sketchshape);
      }
   }
}

