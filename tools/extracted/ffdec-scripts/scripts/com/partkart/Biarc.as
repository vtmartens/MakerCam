package com.partkart
{
   import flash.geom.Point;
   
   public class Biarc
   {
      
      public var p1:Point;
      
      public var p2:Point;
      
      public var p3:Point;
      
      public var c1:Point;
      
      public var c2:Point;
      
      public var r1:Number;
      
      public var r2:Number;
      
      public var flat:Boolean = false;
      
      public function Biarc(pa:Point, pb:Point, pc:Point)
      {
         super();
         this.p1 = pa;
         this.p3 = pc;
         this.p2 = this.incenter(pa,pb,pc);
         var t1:Point = pb.subtract(pa);
         var t2:Point = pc.subtract(pa);
         var circ1:Array = this.arc(this.p1,this.p2,t1);
         var circ2:Array = this.arc(this.p2,this.p3,t2);
         this.r1 = circ1[0];
         this.c1 = circ1[1];
         this.r2 = circ2[0];
         this.c2 = circ2[1];
      }
      
      private function incenter(pa:Point, pb:Point, pc:Point) : Point
      {
         var a:Number = Point.distance(pb,pc);
         var b:Number = Point.distance(pa,pc);
         var c:Number = Point.distance(pa,pb);
         var sum:Number = a + b + c;
         var x:Number = (a * pa.x + b * pb.x + c * pc.x) / sum;
         var y:Number = (a * pa.y + b * pb.y + c * pc.y) / sum;
         return new Point(x,y);
      }
      
      private function arc(point1:Point, point2:Point, tangent:Point) : Array
      {
         tangent.normalize(1);
         var x:Number = point2.x - point1.x;
         var y:Number = point2.y - point1.y;
         var r:Number = -(Math.pow(x,2) + Math.pow(y,2)) / (2 * (y * tangent.x - x * tangent.y));
         var center:Point = new Point(tangent.y * r + point1.x,-tangent.x * r + point1.y);
         return new Array(r,center);
      }
      
      public function getArcs() : Array
      {
         var arc1:CircularArc = new CircularArc(this.p1,this.p2,this.c1,this.r1);
         var arc2:CircularArc = new CircularArc(this.p2,this.p3,this.c2,this.r2);
         return new Array(arc1,arc2);
      }
   }
}

