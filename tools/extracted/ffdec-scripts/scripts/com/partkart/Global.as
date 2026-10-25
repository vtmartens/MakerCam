package com.partkart
{
   import flash.display.BitmapData;
   import flash.geom.Point;
   
   public class Global
   {
      
      public static var zoom:Number = 80;
      
      public static var tool:int = 0;
      
      public static var snap:Boolean = false;
      
      public static var xorigin:Number = 0;
      
      public static var yorigin:Number = 600;
      
      public static var docwidth:int = 950;
      
      public static var docheight:int = 600;
      
      public static var dragging:Boolean = false;
      
      public static var unit:String = "in";
      
      public static var space:Boolean = false;
      
      public static var importres:Number = 72;
      
      public static var localsnap:Boolean = true;
      
      public static var tolerance:Number = 0.001;
      
      public static var bitmaptolerance:Number = 0.007;
      
      public static var maxbitmapsize:Number = 20000;
      
      public static var bitmapsize:Number = 8000;
      
      private static var compatibilitybitmapsize:Number = 4000;
      
      public static var nestbitmapsize:Number = 1000;
      
      public static var separatetoolpaths:Boolean = false;
      
      public static var viewcuts:Boolean = false;
      
      public static var undo:Array = new Array();
      
      private static var undoindex:int = 0;
      
      _init();
      
      public function Global()
      {
         super();
      }
      
      private static function _init() : void
      {
         var testbitmap:BitmapData = null;
         try
         {
            testbitmap = new BitmapData(bitmapsize,bitmapsize,true,0);
            testbitmap.floodFill(0,0,0);
         }
         catch(errObject:Error)
         {
            maxbitmapsize = compatibilitybitmapsize;
            bitmapsize = compatibilitybitmapsize;
         }
      }
      
      public static function undoPush(u:Undo) : void
      {
         undo = undo.slice(0,undoindex + 1);
         undo.push(u);
         if(undo.length > 10)
         {
            undo.shift();
         }
         undoindex = undo.length - 1;
      }
      
      public static function undoAction() : void
      {
         if(undoindex >= 0 && undoindex < undo.length)
         {
            undo[undoindex].undoAction();
            --undoindex;
         }
      }
      
      public static function redoAction() : void
      {
         if(undoindex >= -1 && undoindex < undo.length - 1)
         {
            ++undoindex;
            undo[undoindex].redoAction();
         }
      }
      
      public static function withinTolerance(p1:Point, p2:Point, factor:Number = 1) : Boolean
      {
         var diff:Point = new Point(Math.pow(p1.x - p2.x,2),Math.pow(p1.y - p2.y,2));
         if(diff.x + diff.y < Math.pow(Global.tolerance * factor,2))
         {
            return true;
         }
         return false;
      }
      
      public static function toFixed(number:Number, factor:Number) : Number
      {
         return Math.round(number * factor) / factor;
      }
      
      public static function getAngle(v1:Point, v2:Point) : Number
      {
         v1.normalize(1);
         v2.normalize(1);
         var crossproduct:Number = v1.x * v2.y - v1.y * v2.x;
         var dotproduct:Number = v1.x * v2.x + v1.y * v2.y;
         return Math.atan2(crossproduct,dotproduct);
      }
      
      public static function lineIntersect(A:Point, B:Point, E:Point, F:Point, as_seg:Boolean = false) : Point
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
         if(A.x == B.x)
         {
            ip.x = A.x;
         }
         else if(E.x == F.x)
         {
            ip.x = E.x;
         }
         if(A.y == B.y)
         {
            ip.y = A.y;
         }
         else if(E.y == F.y)
         {
            ip.y = E.y;
         }
         if(as_seg)
         {
            if(Math.abs(A.x - B.x) > 1e-12 && (A.x < B.x ? Boolean(ip.x < A.x || ip.x > B.x) : Boolean(ip.x > A.x || ip.x < B.x)))
            {
               return null;
            }
            if(Math.abs(A.y - B.y) > 1e-12 && (A.y < B.y ? Boolean(ip.y < A.y || ip.y > B.y) : Boolean(ip.y > A.y || ip.y < B.y)))
            {
               return null;
            }
            if(Math.abs(E.x - F.x) > 1e-12 && (E.x < F.x ? Boolean(ip.x < E.x || ip.x > F.x) : Boolean(ip.x > E.x || ip.x < F.x)))
            {
               return null;
            }
            if(Math.abs(E.y - F.y) > 1e-12 && (E.y < F.y ? Boolean(ip.y < E.y || ip.y > F.y) : Boolean(ip.y > E.y || ip.y < F.y)))
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
   }
}

