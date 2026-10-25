package com.partkart
{
   import fl.motion.BezierSegment;
   import flash.geom.Point;
   
   public class CubicBezierSegment extends Segment
   {
      
      public var c1:Point;
      
      public var c2:Point;
      
      private var seglist:Array;
      
      public function CubicBezierSegment(point1:Point, point2:Point, control1:Point, control2:Point)
      {
         super(point1,point2);
         this.c1 = control1;
         this.c2 = control2;
      }
      
      public function linearize(circle:Boolean = false) : Array
      {
         this.seglist = new Array();
         this.seglist.push(this);
         if(circle == true)
         {
            this.inflectiondivide(this,Global.tolerance);
         }
         else
         {
            this.loopdivide(circle);
         }
         return this.seglist;
      }
      
      private function loopdivide(circle:Boolean) : void
      {
         var seg:CubicBezierSegment = null;
         var re:Array = null;
         var dividelist:Array = this.seglist.slice();
         while(dividelist.length > 0)
         {
            while(dividelist.length > 0 && !(dividelist[0] is CubicBezierSegment))
            {
               dividelist.shift();
            }
            if(dividelist.length == 0)
            {
               return;
            }
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
      
      private function inflectiondivide(seg:CubicBezierSegment, tol:Number) : void
      {
         var t:Number = NaN;
         var dis1:Number = NaN;
         var dis2:Number = NaN;
         var ax:Number = -p1.x + 3 * (this.c1.x - this.c2.x) + p2.x;
         var ay:Number = -p1.y + 3 * (this.c1.y - this.c2.y) + p2.y;
         var bx:Number = 3 * (p1.x - 2 * this.c1.x + this.c2.x);
         var by:Number = 3 * (p1.y - 2 * this.c1.y + this.c2.y);
         var cx:Number = 3 * (this.c1.x - p1.x);
         var cy:Number = 3 * (this.c1.y - p1.y);
         var dx:Number = p1.x;
         var dy:Number = p1.y;
         var a:Number = 6 * (ay * bx - ax * by);
         var b:Number = 6 * (ay * cx - ax * cy);
         var c:Number = 2 * (by * cx - bx * cy);
         var roots:Array = BezierSegment.getQuadraticRoots(a,b,c);
         if(!roots || roots.length == 0)
         {
            this.loopdivide(true);
            return;
         }
         if(roots.length > 1)
         {
            if(roots[1] <= 0 || roots[1] >= 1)
            {
               roots.pop();
            }
         }
         if(roots.length > 0)
         {
            if(roots[0] <= 0 || roots[0] >= 1)
            {
               roots.shift();
            }
         }
         if(roots.length == 0)
         {
            this.loopdivide(true);
            return;
         }
         if(roots.length == 1)
         {
            t = Number(roots[0]);
         }
         else if(roots.length > 1)
         {
            dis1 = Math.abs(roots[0] - 0.5);
            dis2 = Math.abs(roots[1] - 0.5);
            if(dis1 <= dis2)
            {
               t = Number(roots[0]);
            }
            else
            {
               t = Number(roots[1]);
            }
         }
         this.subdivide(seg,tol,t,true);
         this.loopdivide(true);
      }
      
      private function subdivide(seg:CubicBezierSegment, tol:Number, t:Number, circle:Boolean = false) : Array
      {
         var biarc:Biarc = null;
         var arcs:Array = null;
         if(this.seglist.length > 1 && circle == true)
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
         var mid2:Point = new Point(seg.c2.x + (seg.p2.x - seg.c2.x) * t,seg.c2.y + (seg.p2.y - seg.c2.y) * t);
         var mid3:Point = new Point(seg.c1.x + (seg.c2.x - seg.c1.x) * t,seg.c1.y + (seg.c2.y - seg.c1.y) * t);
         var mida:Point = new Point(mid1.x + (mid3.x - mid1.x) * t,mid1.y + (mid3.y - mid1.y) * t);
         var midb:Point = new Point(mid3.x + (mid2.x - mid3.x) * t,mid3.y + (mid2.y - mid3.y) * t);
         var midx:Point = new Point(mida.x + (midb.x - mida.x) * t,mida.y + (midb.y - mida.y) * t);
         if(t != 0.5)
         {
            trace(midx.x,midx.y);
         }
         var seg1:CubicBezierSegment = new CubicBezierSegment(seg.p1,midx,mid1,mida);
         var seg2:CubicBezierSegment = new CubicBezierSegment(midx,seg.p2,midb,mid2);
         this.seglist.splice(this.seglist.indexOf(seg),1,seg1,seg2);
         return new Array(seg1,seg2);
      }
      
      private function isbiarc(seg:CubicBezierSegment, tol:Number) : Biarc
      {
         var intersect:Point = this.lineIntersect(seg.p1,seg.c1,seg.p2,seg.c2);
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
         if(biarc == null || isNaN(biarc.r1) || isNaN(biarc.r2))
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
      
      private function getmaxdeviation(t1:Number, t2:Number, seg:CubicBezierSegment, center:Point, radius:Number) : Number
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
      
      private function geterror(t:Number, seg:CubicBezierSegment, center:Point, radius:Number) : Number
      {
         var bezier:BezierSegment = new BezierSegment(seg.p1,seg.c1,seg.c2,seg.p2);
         var currentpoint:Point = bezier.getValue(t);
         return Math.abs(Point.distance(currentpoint,center) - Math.abs(radius));
      }
      
      public function isflat(seg:CubicBezierSegment, tol:Number) : Boolean
      {
         var tolerance:Number = 16 * tol * tol;
         var ux:Number = 3 * seg.c1.x - 2 * seg.p1.x - seg.p2.x;
         ux *= ux;
         var uy:Number = 3 * seg.c1.y - 2 * seg.p1.y - seg.p2.y;
         uy *= uy;
         var vx:Number = 3 * seg.c2.x - 2 * seg.p2.x - seg.p1.x;
         vx *= vx;
         var vy:Number = 3 * seg.c2.y - 2 * seg.p2.y - seg.p1.y;
         vy *= vy;
         if(ux < vx)
         {
            ux = vx;
         }
         if(uy < vy)
         {
            uy = vy;
         }
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
         return new CubicBezierSegment(p2,p1,this.c2,this.c1);
      }
   }
}

