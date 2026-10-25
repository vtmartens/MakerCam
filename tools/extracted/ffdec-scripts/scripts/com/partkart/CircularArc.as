package com.partkart
{
   import flash.geom.Point;
   import flash.geom.Rectangle;
   
   public class CircularArc extends ArcSegment
   {
      
      public var center:Point;
      
      public var radius:Number;
      
      public function CircularArc(point1:Point, point2:Point, c:Point, r:Number)
      {
         var dtheta:Number = NaN;
         this.center = c;
         this.radius = r;
         var theta1:Number = Math.atan2(point1.y - this.center.y,point1.x - this.center.x);
         var theta2:Number = Math.atan2(point2.y - this.center.y,point2.x - this.center.x);
         var dtheta1:Number = (theta2 - theta1) * 180 / Math.PI;
         var dtheta2:Number = (Math.PI - theta2 + theta1) * 180 / Math.PI;
         if(dtheta1 > 360)
         {
            dtheta1 -= 360;
         }
         else if(dtheta1 < -360)
         {
            dtheta1 += 360;
         }
         if(dtheta2 > 360)
         {
            dtheta2 -= 360;
         }
         else if(dtheta2 < -360)
         {
            dtheta2 += 360;
         }
         if(Math.abs(dtheta1) <= Math.abs(dtheta2))
         {
            dtheta = dtheta1;
         }
         else
         {
            dtheta = dtheta2;
         }
         var large:Boolean = false;
         var m:Number = (this.center.x - point1.x) * (point2.y - point1.y) - (point2.x - point1.x) * (this.center.y - point1.y);
         if((m > 0 && r < 0 || m < 0 && r > 0) && Math.abs(m) > Global.tolerance)
         {
            large = true;
         }
         large = false;
         if(Math.abs(dtheta) < 0.000001 || Math.abs(dtheta + 180) < 1e-8 || Math.abs(dtheta - 180) < 1e-7)
         {
            dtheta = 0;
         }
         var sweep:Boolean = false;
         if(dtheta > 0)
         {
            sweep = true;
         }
         if(dtheta == 0 && r < 0)
         {
            sweep = true;
         }
         else if(dtheta == 0 && r > 0)
         {
            sweep = false;
         }
         super(point1,point2,Math.abs(r),Math.abs(r),0,large,sweep);
      }
      
      override public function offset(r:Number) : Boolean
      {
         var inverse:Boolean = false;
         var newradius:Number = this.radius + r;
         inverse = false;
         if(newradius / Math.abs(newradius) != this.radius / Math.abs(this.radius))
         {
            inverse = true;
         }
         this.radius = newradius;
         rx = this.radius;
         ry = this.radius;
         var r1:Point = new Point(p1.x - this.center.x,p1.y - this.center.y);
         var r2:Point = new Point(p2.x - this.center.x,p2.y - this.center.y);
         if(inverse)
         {
            r1.normalize(-Math.abs(this.radius));
            r2.normalize(-Math.abs(this.radius));
         }
         else
         {
            r1.normalize(Math.abs(this.radius));
            r2.normalize(Math.abs(this.radius));
         }
         p1.x = this.center.x + r1.x;
         p1.y = this.center.y + r1.y;
         p2.x = this.center.x + r2.x;
         p2.y = this.center.y + r2.y;
         return true;
      }
      
      public function arcclone() : CircularArc
      {
         var p1clone:Point = p1.clone();
         var p2clone:Point = p2.clone();
         var centerclone:Point = this.center.clone();
         return new CircularArc(p1clone,p2clone,centerclone,this.radius);
      }
      
      override public function getLength() : Number
      {
         var radians:Number = Global.getAngle(new Point(p1.x - this.center.x,p1.y - this.center.y),new Point(p2.x - this.center.x,p2.y - this.center.y));
         var length:Number = radians * this.radius;
         return Math.abs(length);
      }
      
      public function onArc(p:Point) : Boolean
      {
         var norm1:Point = null;
         var norm2:Point = null;
         var normpoint:Point = null;
         var m:* = undefined;
         normpoint = new Point(p.x - this.center.x,p.y - this.center.y);
         norm1 = new Point(p1.x - this.center.x,p1.y - this.center.y);
         norm2 = new Point(p2.x - this.center.x,p2.y - this.center.y);
         var angle1:Number = Global.getAngle(norm1,normpoint);
         var angle2:Number = Global.getAngle(norm1,norm2);
         var pi:Number = Math.PI;
         if(angle1 == 0 || angle2 == 0)
         {
            return false;
         }
         if(Math.PI - Math.abs(angle2) < 1e-10)
         {
            m = (p.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p.y - p1.y);
            if(m > 0 && this.radius < 0 || m < 0 && this.radius > 0)
            {
               return true;
            }
            return false;
         }
         if(angle2 > 0 && angle1 > 0 && angle1 < angle2 || angle2 < 0 && angle1 < 0 && angle1 > angle2)
         {
            return true;
         }
         return false;
      }
      
      public function getExactBounds() : Rectangle
      {
         var minx:Number = Math.min(p1.x,p2.x);
         var miny:Number = Math.min(p1.y,p2.y);
         var maxx:Number = Math.max(p1.x,p2.x);
         var maxy:Number = Math.max(p1.y,p2.y);
         if(this.onArc(new Point(this.center.x + Math.abs(this.radius),this.center.y)))
         {
            maxx = this.center.x + Math.abs(this.radius);
         }
         if(this.onArc(new Point(this.center.x - Math.abs(this.radius),this.center.y)))
         {
            minx = this.center.x - Math.abs(this.radius);
         }
         if(this.onArc(new Point(this.center.x,this.center.y + Math.abs(this.radius))))
         {
            maxy = this.center.y + Math.abs(this.radius);
         }
         if(this.onArc(new Point(this.center.x,this.center.y - Math.abs(this.radius))))
         {
            miny = this.center.y - Math.abs(this.radius);
         }
         return new Rectangle(minx,miny,maxx - minx,maxy - miny);
      }
      
      override public function getPointFromLength(length:Number) : Point
      {
         var norm1:Point = new Point(p1.x - this.center.x,p1.y - this.center.y);
         var norm2:Point = new Point(p2.x - this.center.x,p2.y - this.center.y);
         var angle:Number = Global.getAngle(norm1,norm2);
         var theta:Number = length / Math.abs(this.radius);
         if(angle < 0)
         {
            theta = -theta;
         }
         theta += Math.atan2(norm1.y,norm1.x);
         var dx:Number = Math.abs(this.radius) * Math.cos(theta);
         var dy:Number = Math.abs(this.radius) * Math.sin(theta);
         return new Point(this.center.x + dx,this.center.y + dy);
      }
      
      override public function splitByLength(length:Number) : Array
      {
         if(length == 0)
         {
            return new Array(this);
         }
         var splitpoint:Point = this.getPointFromLength(length);
         var arc1:CircularArc = new CircularArc(p1,splitpoint,this.center.clone(),this.radius);
         var arc2:CircularArc = new CircularArc(splitpoint,p2,this.center.clone(),this.radius);
         return new Array(arc1,arc2);
      }
      
      override public function reverse() : *
      {
         return new CircularArc(p2,p1,this.center.clone(),-this.radius);
      }
      
      public function recalculateCenter() : void
      {
         var hypo:Number = Point.distance(p1,p2);
         var mid:Point = Point.interpolate(p1,p2,0.5);
         var normal:Point = new Point(-p2.y + p1.y,p2.x - p1.x);
         var distance:Number = Math.sqrt(this.radius * this.radius - 0.25 * hypo * hypo);
         normal.normalize(distance);
         if(this.radius > 0)
         {
            normal.x = -normal.x;
            normal.y = -normal.y;
         }
         this.center.x = mid.x + normal.x;
         this.center.y = mid.y + normal.y;
      }
   }
}

