package com.partkart
{
   import flash.geom.Point;
   
   public class QuadBezierSegment extends Segment
   {
      
      public var c1:Point;
      
      private var seglist:Array;
      
      public function QuadBezierSegment(point1:Point, point2:Point, control1:Point)
      {
         super(point1,point2);
         this.c1 = control1;
      }
      
      public function getPoint(time:Number, point:Point = null) : Point
      {
         if(isNaN(time))
         {
            return undefined;
         }
         point = point as Point || new Point();
         var f:Number = 1 - time;
         point.x = p1.x * f * f + this.c1.x * 2 * time * f + p2.x * time * time;
         point.y = p1.y * f * f + this.c1.y * 2 * time * f + p2.y * time * time;
         return point;
      }
      
      public function linearize(circle:Boolean = false) : Array
      {
         this.seglist = new Array();
         this.seglist.push(this);
         this.loopdivide(circle);
         return this.seglist;
      }
      
      private function loopdivide(circle:Boolean) : void
      {
         var seg:QuadBezierSegment = null;
         var re:Array = null;
         var dividelist:Array = this.seglist.slice();
         while(dividelist.length > 0)
         {
            seg = dividelist[0];
            re = this.subdivide(seg,Global.tolerance,0.5,circle);
            if(Boolean(re) && re.length == 2)
            {
               dividelist.splice(0,1,re[0],re[1]);
            }
            else
            {
               dividelist.shift();
            }
         }
      }
      
      private function subdivide(seg:QuadBezierSegment, tol:Number, t:Number, circle:* = false) : Array
      {
         var biarc:Biarc = null;
         var arcs:Array = null;
         if(circle)
         {
            biarc = this.isbiarc(seg,tol);
            if(biarc)
            {
               arcs = biarc.getArcs();
               this.seglist.splice(this.seglist.indexOf(seg),1,arcs[0],arcs[1]);
               return null;
            }
         }
         if(circle == false && this.isflat(seg,tol) || circle == true && this.isflat(seg,0.5 * tol))
         {
            this.seglist.splice(this.seglist.indexOf(seg),1,new Segment(seg.p1,seg.p2));
            return null;
         }
         var mid1:Point = new Point(seg.p1.x + (seg.c1.x - seg.p1.x) * t,seg.p1.y + (seg.c1.y - seg.p1.y) * t);
         var mid2:Point = new Point(seg.c1.x + (seg.p2.x - seg.c1.x) * t,seg.c1.y + (seg.p2.y - seg.c1.y) * t);
         var mid3:Point = new Point(mid1.x + (mid2.x - mid1.x) * t,mid1.y + (mid2.y - mid1.y) * t);
         var seg1:QuadBezierSegment = new QuadBezierSegment(seg.p1,mid3,mid1);
         var seg2:QuadBezierSegment = new QuadBezierSegment(mid3,seg.p2,mid2);
         this.seglist.splice(this.seglist.indexOf(seg),1,seg1,seg2);
         return new Array(seg1,seg2);
      }
      
      private function isbiarc(seg:QuadBezierSegment, tol:Number) : Biarc
      {
         var intersect:Point = seg.c1;
         if(intersect == null)
         {
            return null;
         }
         var biarc:Biarc = new Biarc(seg.p1,intersect,seg.p2);
         var radiuslimit:Number = 400;
         if(Global.unit == "cm")
         {
            radiuslimit *= 2.54;
         }
         if(biarc == null || isNaN(biarc.r1) || isNaN(biarc.r2) || Math.abs(biarc.r1) > radiuslimit || Math.abs(biarc.r2) > radiuslimit)
         {
            return null;
         }
         var deviation1:Number = this.getmaxdeviation(0,0.5,seg,biarc.c1,biarc.r1);
         var deviation2:Number = this.getmaxdeviation(0.5,1,seg,biarc.c2,biarc.r2);
         var deviation:Number = Math.max(deviation1,deviation2);
         if(deviation < tol)
         {
            return biarc;
         }
         return null;
      }
      
      private function getmaxdeviation(t1:Number, t2:Number, seg:QuadBezierSegment, center:Point, radius:Number) : Number
      {
         var e:Number = NaN;
         var error:Number = 0;
         for(var i:int = 0; i < 20; i++)
         {
            e = this.geterror(t1 + i / 20 * (t2 - t1),seg,center,radius);
            if(e > error)
            {
               error = e;
            }
         }
         return error;
      }
      
      private function geterror(t:Number, seg:QuadBezierSegment, center:Point, radius:Number) : Number
      {
         var currentpoint:Point = seg.getPoint(t);
         return Math.abs(Point.distance(currentpoint,center) - Math.abs(radius));
      }
      
      public function isflat(seg:QuadBezierSegment, tol:Number) : Boolean
      {
         var tolerance:Number = 4 * tol * tol;
         var ux:Number = 2 * seg.c1.x - seg.p1.x - seg.p2.x;
         ux *= ux;
         var uy:Number = 2 * seg.c1.y - seg.p1.y - seg.p2.y;
         uy *= uy;
         return ux + uy <= tolerance;
      }
      
      public function lineIntersect(A:Point, B:Point, E:Point, F:Point, as_seg:Boolean = false) : Point
      {
         var ip:Point = null;
         var a1:Number = NaN;
         var a2:Number = NaN;
         var b1:Number = NaN;
         var b2:Number = NaN;
         var c1:Number = NaN;
         var c2:Number = NaN;
         a1 = B.y - A.y;
         b1 = A.x - B.x;
         c1 = B.x * A.y - A.x * B.y;
         a2 = F.y - E.y;
         b2 = E.x - F.x;
         c2 = F.x * E.y - E.x * F.y;
         var denom:Number = a1 * b2 - a2 * b1;
         if(denom == 0)
         {
            return null;
         }
         ip = new Point();
         ip.x = (b1 * c2 - b2 * c1) / denom;
         ip.y = (a2 * c1 - a1 * c2) / denom;
         if(as_seg)
         {
            if(Math.pow(ip.x - B.x,2) + Math.pow(ip.y - B.y,2) > Math.pow(A.x - B.x,2) + Math.pow(A.y - B.y,2))
            {
               return null;
            }
            if(Math.pow(ip.x - A.x,2) + Math.pow(ip.y - A.y,2) > Math.pow(A.x - B.x,2) + Math.pow(A.y - B.y,2))
            {
               return null;
            }
            if(Math.pow(ip.x - F.x,2) + Math.pow(ip.y - F.y,2) > Math.pow(E.x - F.x,2) + Math.pow(E.y - F.y,2))
            {
               return null;
            }
            if(Math.pow(ip.x - E.x,2) + Math.pow(ip.y - E.y,2) > Math.pow(E.x - F.x,2) + Math.pow(E.y - F.y,2))
            {
               return null;
            }
         }
         if(isNaN(ip.x) || isNaN(ip.y))
         {
            return null;
         }
         return ip;
      }
      
      override public function reverse() : *
      {
         return new QuadBezierSegment(p2,p1,this.c1);
      }
   }
}

