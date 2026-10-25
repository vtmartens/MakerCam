package com.lorentz.SVG
{
   import flash.geom.Point;
   
   public final class Bezier
   {
      
      public static var tolerance:Number = 0;
      
      public static var savedBeziers:Object = new Object();
      
      public var p1:Point = null;
      
      public var p2:Point = null;
      
      public var c1:Point = null;
      
      public var c2:Point = null;
      
      public var QPts:Array = null;
      
      public function Bezier(p1Anchor:Point, c1Control:Point, c2Control:Point, p2Anchor:Point)
      {
         super();
         this.p1 = p1Anchor;
         this.p2 = p2Anchor;
         this.c1 = c1Control;
         this.c2 = c2Control;
         this.QPts = new Array();
         this.getQuadBezier(this.p1,this.c1,this.c2,this.p2);
      }
      
      private function getQuadBezier(p1Anchor:Point, c1Control:Point, c2Control:Point, p2Anchor:Point) : void
      {
         if(tolerance == 0)
         {
            this.GetQuadBez_TG(p1Anchor,c1Control,c2Control,p2Anchor);
         }
         else
         {
            this.GetQuadBez_RP(p1Anchor,c1Control,c2Control,p2Anchor);
         }
      }
      
      private function GetQuadBez_TG(P0:Point, P1:Point, P2:Point, P3:Point) : void
      {
         var PA:Point = MathUtils.ratioTo(P0,P1,3 / 4);
         var PB:Point = MathUtils.ratioTo(P3,P2,3 / 4);
         var dx:Number = (P3.x - P0.x) / 16;
         var dy:Number = (P3.y - P0.y) / 16;
         var Pc_1:Point = MathUtils.ratioTo(P0,P1,3 / 8);
         var Pc_2:Point = MathUtils.ratioTo(PA,PB,3 / 8);
         Pc_2.x -= dx;
         Pc_2.y -= dy;
         var Pc_3:Point = MathUtils.ratioTo(PB,PA,3 / 8);
         Pc_3.x += dx;
         Pc_3.y += dy;
         var Pc_4:Point = MathUtils.ratioTo(P3,P2,3 / 8);
         var Pa_1:Point = MathUtils.midLine(Pc_1,Pc_2);
         var Pa_2:Point = MathUtils.midLine(PA,PB);
         var Pa_3:Point = MathUtils.midLine(Pc_3,Pc_4);
         this.QPts = [{
            "p":Pa_1,
            "c":Pc_1
         },{
            "p":Pa_2,
            "c":Pc_2
         },{
            "p":Pa_3,
            "c":Pc_3
         },{
            "p":P3,
            "c":Pc_4
         }];
      }
      
      private function GetQuadBez_RP(a:Point, b:Point, c:Point, d:Point) : void
      {
         var dx:Number = NaN;
         var dy:Number = NaN;
         var mp:Point = null;
         var s:Point = MathUtils.intersect2Lines(a,b,c,d);
         if(Boolean(s) && Boolean(!isNaN(s.x)) && !isNaN(s.y))
         {
            dx = (a.x + d.x + s.x * 4 - (b.x + c.x) * 3) * 0.125;
            dy = (a.y + d.y + s.y * 4 - (b.y + c.y) * 3) * 0.125;
            if(dx * dx + dy * dy <= tolerance * tolerance)
            {
               this.QPts.push({
                  "p":d,
                  "c":s
               });
               return;
            }
         }
         else
         {
            mp = Point.interpolate(a,d,0.5);
            if(Point.distance(a,mp) <= tolerance)
            {
               this.QPts.push({
                  "p":d,
                  "c":mp
               });
               return;
            }
         }
         var halves:Object = MathUtils.bezierSplit(a,b,c,d);
         var b0:Object = halves.b0;
         var b1:Object = halves.b1;
         this.getQuadBezier(a,b0.b,b0.c,b0.d);
         this.getQuadBezier(b1.a,b1.b,b1.c,d);
      }
   }
}

