package com.partkart
{
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Point;
   
   public class Pen extends Path
   {
      
      private var pointlist:Array;
      
      private var inithandle:Point;
      
      private var currentpoint:Point;
      
      private var closedot:Dot;
      
      public var mousedown:Boolean = false;
      
      public function Pen(inputpoint:Point)
      {
         super();
         this.pointlist = new Array();
         this.currentpoint = inputpoint;
         this.pointlist.push(inputpoint);
         addEventListener(MouseEvent.MOUSE_OVER,this.penOver);
      }
      
      public function startPoint(pivot:Point) : *
      {
         var handle:Point = null;
         var cubic:CubicBezierSegment = null;
         if(seglist.length > 0 && seglist[seglist.length - 1] is CubicBezierSegment)
         {
            cubic = seglist[seglist.length - 1];
            handle = new Point(cubic.p2.x + (cubic.p2.x - cubic.c2.x),cubic.p2.y + (cubic.p2.y - cubic.c2.y));
         }
         else if(this.inithandle)
         {
            handle = this.inithandle;
            this.inithandle = null;
         }
         else
         {
            handle = this.currentpoint.clone();
         }
         cubic = new CubicBezierSegment(this.currentpoint,pivot,handle,pivot.clone());
         addSegment(cubic);
         this.currentpoint = pivot;
      }
      
      public function finishPoint() : void
      {
         var cubic:CubicBezierSegment = null;
         if(seglist.length > 0)
         {
            cubic = seglist[seglist.length - 1];
            if(Point.distance(cubic.c2,cubic.p2) * Global.zoom < 1)
            {
               seglist[seglist.length - 1] = new Segment(cubic.p1,cubic.p2);
               resetSegments();
            }
            redraw();
         }
         else
         {
            this.inithandle = new Point(this.mouseX / Global.zoom,-this.mouseY / Global.zoom);
         }
      }
      
      public function setPosition() : void
      {
         var cubic:CubicBezierSegment = null;
         var handle:Point = null;
         var invert:Point = null;
         this.graphics.clear();
         if(this.currentpoint != null)
         {
            if(!this.mousedown)
            {
               this.graphics.lineStyle(1,13421772,1);
               this.graphics.moveTo(this.currentpoint.x * Global.zoom,-this.currentpoint.y * Global.zoom);
               this.graphics.lineTo(this.mouseX,this.mouseY);
            }
            else if(seglist.length > 0)
            {
               cubic = seglist[seglist.length - 1];
               handle = new Point(this.mouseX / Global.zoom,-this.mouseY / Global.zoom);
               cubic.c2.x = cubic.p2.x + (cubic.p2.x - handle.x);
               cubic.c2.y = cubic.p2.y + (cubic.p2.y - handle.y);
               redraw(cubic);
               this.graphics.lineStyle(1,13421772,1);
               this.graphics.moveTo(cubic.c2.x * Global.zoom,-cubic.c2.y * Global.zoom);
               this.graphics.lineTo(this.mouseX,this.mouseY);
               graphics.beginFill(11184810);
               graphics.drawCircle(cubic.c2.x * Global.zoom,-cubic.c2.y * Global.zoom,5);
               graphics.drawCircle(this.mouseX,this.mouseY,5);
               graphics.endFill();
            }
            else
            {
               invert = new Point(this.currentpoint.x + this.currentpoint.x - this.mouseX / Global.zoom,this.currentpoint.y + this.currentpoint.y + this.mouseY / Global.zoom);
               this.graphics.lineStyle(1,13421772,1);
               this.graphics.moveTo(invert.x * Global.zoom,-invert.y * Global.zoom);
               this.graphics.lineTo(this.mouseX,this.mouseY);
               graphics.beginFill(11184810);
               graphics.drawCircle(invert.x * Global.zoom,-invert.y * Global.zoom,5);
               graphics.drawCircle(this.mouseX,this.mouseY,5);
               graphics.endFill();
            }
         }
      }
      
      private function penOver(e:MouseEvent) : void
      {
         var point:Point = null;
         var dot:Dot = null;
         if(seglist.length > 0)
         {
            point = new Point(this.mouseX / Global.zoom,-this.mouseY / Global.zoom);
            if(this.closedot == null)
            {
               if(Point.distance(point,seglist[0].p1) * Global.zoom < 8)
               {
                  dot = new Dot();
                  dot.point = seglist[0].p1;
                  dot.x = dot.point.x * Global.zoom;
                  dot.y = -dot.point.y * Global.zoom;
                  dot.setLoop();
                  this.closedot = dot;
                  addChild(dot);
                  dot.addEventListener(MouseEvent.MOUSE_DOWN,this.dotDown);
               }
            }
            else if(Point.distance(point,this.closedot.point) * Global.zoom < 8)
            {
               this.closedot.x = this.closedot.point.x * Global.zoom;
               this.closedot.y = -this.closedot.point.y * Global.zoom;
               this.closedot.setLoop();
               addChild(this.closedot);
            }
            else if(contains(this.closedot))
            {
               removeChild(this.closedot);
            }
         }
      }
      
      public function dotDown(e:MouseEvent) : void
      {
         var main:* = undefined;
         e.stopPropagation();
         var dot:Dot = e.target as Dot;
         if(dot)
         {
            this.startPoint(dot.point);
            graphics.clear();
            if(contains(dot))
            {
               removeChild(dot);
            }
            removeEventListener(MouseEvent.MOUSE_OVER,this.penOver);
            main = this.parent.parent;
            main.finishPen();
         }
      }
   }
}

