package com.partkart
{
   import flash.display.LineScaleMode;
   import flash.display.Sprite;
   import flash.geom.Point;
   
   public class Segment extends Sprite
   {
      
      public var p1:Point;
      
      public var p2:Point;
      
      public var active:Boolean = false;
      
      public var linestyle:int = 0;
      
      public function Segment(point1:Point, point2:Point)
      {
         super();
         this.p1 = point1;
         this.p2 = point2;
      }
      
      public function setLineStyle(style:int) : void
      {
         this.linestyle = style;
         switch(style)
         {
            case 0:
               graphics.lineStyle(2,3355443,1,true,LineScaleMode.NONE);
               break;
            case 1:
               graphics.lineStyle(3,15615232,1,true,LineScaleMode.NONE);
               break;
            case 2:
               graphics.lineStyle(1,0,0.3,false,LineScaleMode.NONE);
               break;
            case 3:
               graphics.lineStyle(1,30464,1,true,LineScaleMode.NONE);
               break;
            case 4:
               graphics.lineStyle(2,39185,1,true,LineScaleMode.NONE);
               break;
            case 5:
               graphics.lineStyle(1,2254574,1,true,LineScaleMode.NONE);
               break;
            case 6:
               graphics.lineStyle(2,3368703,1,true,LineScaleMode.NONE);
         }
      }
      
      public function offset(radius:Number) : Boolean
      {
         var delta:Point = new Point(this.p2.x - this.p1.x,this.p2.y - this.p1.y);
         var normal:Point = new Point(-delta.y,delta.x);
         normal.normalize(radius);
         this.p1.x += normal.x;
         this.p2.x += normal.x;
         this.p1.y += normal.y;
         this.p2.y += normal.y;
         return true;
      }
      
      public function clone() : Segment
      {
         var p1clone:Point = this.p1.clone();
         var p2clone:Point = this.p2.clone();
         return new Segment(p1clone,p2clone);
      }
      
      public function getNormal() : Point
      {
         return new Point(-this.p2.y + this.p1.y,this.p2.x - this.p1.x);
      }
      
      public function getLength() : Number
      {
         return Math.sqrt(Math.pow(this.p2.x - this.p1.x,2) + Math.pow(this.p2.y - this.p1.y,2));
      }
      
      public function getPointFromLength(length:Number) : Point
      {
         var tlength:Number = this.getLength();
         var t:Number = length / tlength;
         return new Point((1 - t) * this.p1.x + t * this.p2.x,(1 - t) * this.p1.y + t * this.p2.y);
      }
      
      public function splitByLength(length:Number) : Array
      {
         if(length == 0)
         {
            return new Array(this);
         }
         var splitpoint:Point = this.getPointFromLength(length);
         var seg1:Segment = new Segment(this.p1,splitpoint);
         var seg2:Segment = new Segment(splitpoint,this.p2);
         return new Array(seg1,seg2);
      }
      
      public function reverse() : *
      {
         return new Segment(this.p2,this.p1);
      }
   }
}

