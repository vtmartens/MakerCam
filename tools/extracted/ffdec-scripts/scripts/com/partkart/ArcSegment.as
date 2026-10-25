package com.partkart
{
   import flash.geom.Point;
   
   public class ArcSegment extends Segment
   {
      
      public var rx:Number;
      
      public var ry:Number;
      
      public var angle:Number;
      
      public var lf:Boolean;
      
      public var sf:Boolean;
      
      public function ArcSegment(point1:Point, point2:Point, radiusx:Number, radiusy:Number, axisangle:Number, largeflag:Boolean, sweepflag:Boolean)
      {
         super(point1,point2);
         this.rx = radiusx;
         this.ry = radiusy;
         this.angle = axisangle;
         this.lf = largeflag;
         this.sf = sweepflag;
      }
      
      protected static function degreesToRadians(angle:Number) : Number
      {
         return angle * (Math.PI / 180);
      }
      
      protected static function radiansToDegrees(angle:Number) : Number
      {
         return angle * (180 / Math.PI);
      }
      
      public function computeSvgArc() : Object
      {
         var p:Number = NaN;
         var n:Number = NaN;
         var largeArcFlag:Boolean = this.lf;
         var sweepFlag:Boolean = !this.sf;
         var xAxisRotation:Number = this.angle;
         var dx2:Number = (p2.x - p1.x) / 2;
         var dy2:Number = (p2.y - p1.y) / 2;
         this.angle = degreesToRadians(this.angle);
         var cosAngle:Number = Math.cos(this.angle);
         var sinAngle:Number = Math.sin(this.angle);
         var x1:Number = cosAngle * dx2 + sinAngle * dy2;
         var y1:Number = -sinAngle * dx2 + cosAngle * dy2;
         this.rx = Math.abs(this.rx);
         this.ry = Math.abs(this.ry);
         var Prx:Number = this.rx * this.rx;
         var Pry:Number = this.ry * this.ry;
         var Px1:Number = x1 * x1;
         var Py1:Number = y1 * y1;
         var radiiCheck:Number = Px1 / Prx + Py1 / Pry;
         if(radiiCheck > 1)
         {
            this.rx = Math.sqrt(radiiCheck) * this.rx;
            this.ry = Math.sqrt(radiiCheck) * this.ry;
            Prx = this.rx * this.rx;
            Pry = this.ry * this.ry;
         }
         var sign:Number = largeArcFlag == sweepFlag ? -1 : 1;
         var sq:Number = (Prx * Pry - Prx * Py1 - Pry * Px1) / (Prx * Py1 + Pry * Px1);
         sq = sq < 0 ? 0 : sq;
         var coef:Number = sign * Math.sqrt(sq);
         var cx1:Number = coef * (this.rx * y1 / this.ry);
         var cy1:Number = coef * -(this.ry * x1 / this.rx);
         var sx2:Number = (p2.x + p1.x) / 2;
         var sy2:Number = (p2.y + p1.y) / 2;
         var cx:Number = sx2 + (cosAngle * cx1 - sinAngle * cy1);
         var cy:Number = sy2 + (sinAngle * cx1 + cosAngle * cy1);
         var ux:Number = (x1 - cx1) / this.rx;
         var uy:Number = (y1 - cy1) / this.ry;
         var vx:Number = (-x1 - cx1) / this.rx;
         var vy:Number = (-y1 - cy1) / this.ry;
         n = Math.sqrt(ux * ux + uy * uy);
         p = ux;
         sign = uy < 0 ? -1 : 1;
         var angleStart:Number = radiansToDegrees(sign * Math.acos(p / n));
         n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
         p = ux * vx + uy * vy;
         sign = ux * vy - uy * vx < 0 ? -1 : 1;
         var angleExtent:Number = radiansToDegrees(sign * Math.acos(p / n));
         if(!sweepFlag && angleExtent > 0)
         {
            angleExtent -= 360;
         }
         else if(sweepFlag && angleExtent < 0)
         {
            angleExtent += 360;
         }
         angleExtent %= 360;
         angleStart %= 360;
         return Object({
            "x":p2.x,
            "y":p2.y,
            "startAngle":angleStart,
            "arc":angleExtent,
            "radius":this.rx,
            "yRadius":this.ry,
            "xAxisRotation":xAxisRotation,
            "cx":cx,
            "cy":cy
         });
      }
      
      public function linearize(circle:Boolean = false) : Array
      {
         var beta:Number = NaN;
         var sinbeta:Number = NaN;
         var cosbeta:Number = NaN;
         var cx:Number = NaN;
         var cy:Number = NaN;
         var x1:Number = NaN;
         var y1:Number = NaN;
         var tp1:Point = null;
         var tp2:Point = null;
         var tc1:Point = null;
         var i:int = 0;
         var sinangle:Number = NaN;
         var cosangle:Number = NaN;
         var div:Number = NaN;
         var ellipticalArc:Object = this.computeSvgArc();
         var startpoint:Point = p2;
         var x:Number = Number(ellipticalArc.cx);
         var y:Number = Number(ellipticalArc.cy);
         var startAngle:Number = Number(ellipticalArc.startAngle);
         var arc:Number = Number(ellipticalArc.arc);
         var radius:Number = Number(ellipticalArc.radius);
         var yRadius:Number = Number(ellipticalArc.yRadius);
         var xAxisRotation:* = ellipticalArc.xAxisRotation;
         if(Math.abs(arc) > 360)
         {
            arc = 360;
         }
         var segs:Number = Math.ceil(Math.abs(arc) / 45);
         var segAngle:Number = arc / segs;
         var theta:Number = degreesToRadians(segAngle);
         var angle:Number = degreesToRadians(startAngle);
         var seglist:Array = new Array();
         if(segs > 0)
         {
            beta = degreesToRadians(xAxisRotation);
            sinbeta = Math.sin(beta);
            cosbeta = Math.cos(beta);
            tp1 = startpoint;
            for(i = 0; i < segs; i++)
            {
               angle += theta;
               sinangle = Math.sin(angle - theta / 2);
               cosangle = Math.cos(angle - theta / 2);
               div = Math.cos(theta / 2);
               cx = x + (radius * cosangle * cosbeta - yRadius * sinangle * sinbeta) / div;
               cy = y + (radius * cosangle * sinbeta + yRadius * sinangle * cosbeta) / div;
               sinangle = Math.sin(angle);
               cosangle = Math.cos(angle);
               x1 = x + (radius * cosangle * cosbeta - yRadius * sinangle * sinbeta);
               y1 = y + (radius * cosangle * sinbeta + yRadius * sinangle * cosbeta);
               tp2 = new Point(x1,y1);
               tc1 = new Point(cx,cy);
               if(i == segs - 1)
               {
                  seglist.push(new QuadBezierSegment(tp1,p1,tc1));
               }
               else
               {
                  seglist.push(new QuadBezierSegment(tp1,tp2,tc1));
               }
               tp1 = tp2;
            }
         }
         var newseglist:Array = new Array();
         for(i = 0; i < seglist.length; i++)
         {
            newseglist = newseglist.concat(seglist[i].linearize(circle));
         }
         return this.reversePath(newseglist);
      }
      
      protected function reversePath(seglist:Array) : Array
      {
         for(var i:int = 0; i < seglist.length; i++)
         {
            seglist[i] = seglist[i].reverse();
         }
         seglist.reverse();
         return seglist;
      }
      
      override public function reverse() : *
      {
         return new ArcSegment(p2,p1,this.rx,this.ry,this.angle,this.lf,!this.sf);
      }
   }
}

