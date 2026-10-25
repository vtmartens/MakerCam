package com.partkart
{
   import com.lorentz.SVG.*;
   import flash.geom.Point;
   
   public class PathParser
   {
      
      private var subPaths:Array;
      
      private var seglist:Array = new Array();
      
      protected const WIDTH:String = "width";
      
      protected const HEIGHT:String = "height";
      
      private var cpoint:Point = new Point(0,0);
      
      private var opoint:Point = this.cpoint;
      
      private var lastC:Point;
      
      private var parent:SVGToPath;
      
      public function PathParser(svgtopath:SVGToPath)
      {
         super();
         this.parent = svgtopath;
      }
      
      public function parse(commands:Array) : Path
      {
         var p:Path = null;
         this.subPaths = this.extractSubPaths(commands);
         for(var i:int = 0; i < this.subPaths.length; i++)
         {
            this.parseSubPath(this.subPaths[i]);
         }
         if(this.seglist.length > 0)
         {
            p = new Path();
            for(i = 0; i < this.seglist.length; i++)
            {
               p.addSegment(this.seglist[i]);
            }
            return p;
         }
         return null;
      }
      
      private function extractSubPaths(commands:Array) : Array
      {
         var path:Array = null;
         var command:PathCommand = null;
         var cargs:Array = null;
         var reltype:String = null;
         var i:int = 0;
         var _subPaths:Array = new Array();
         for each(command in commands)
         {
            if(command.type == "M" || command.type == "m")
            {
               if(path != null && path.length > 0)
               {
                  _subPaths.push(path);
               }
               path = new Array();
               path.push(command);
               cargs = command.args;
               if(cargs.length > 2)
               {
                  reltype = command.type == "M" ? "L" : "l";
                  for(i = 2; i < cargs.length; i += 2)
                  {
                     path.push(new PathCommand(reltype,new Array(cargs[i],cargs[i + 1])));
                  }
                  command.args = new Array(cargs[0],cargs[1]);
               }
            }
            else
            {
               path.push(command);
            }
         }
         if(path != null)
         {
            _subPaths.push(path);
         }
         return _subPaths;
      }
      
      private function parseSubPath(subPath:Array) : void
      {
         var command:PathCommand = null;
         var args:Array = null;
         var a:* = 0;
         for(var c:int = 0; c < subPath.length; c++)
         {
            command = subPath[c];
            if(command.type == "Z" || command.type == "z")
            {
               this.closePath();
            }
            else
            {
               args = command.args;
               a = 0;
               loop1:
               while(a < args.length)
               {
                  switch(command.type)
                  {
                     case "M":
                        this.moveToAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "m":
                        this.moveToRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "L":
                        this.lineToAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "l":
                        this.lineToRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "H":
                        this.lineToHorizontalAbs(this.getUnit(args[a++],this.WIDTH));
                        break;
                     case "h":
                        this.lineToHorizontalRel(this.getUnit(args[a++],this.WIDTH));
                        break;
                     case "V":
                        this.lineToVerticalAbs(this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "v":
                        this.lineToVerticalRel(this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "Q":
                        this.curveToQuadraticAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "q":
                        this.curveToQuadraticRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "S":
                        this.curveToCubicSmoothAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "s":
                        this.curveToCubicSmoothRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "T":
                        this.curveToQuadraticSmoothAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "t":
                        this.curveToQuadraticSmoothRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "C":
                        this.cubicCurveToAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "c":
                        this.cubicCurveToRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "A":
                        this.arcAbs(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),args[a++],args[a++] != 0,args[a++] != 0,this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     case "a":
                        this.arcRel(this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT),args[a++],args[a++] != 0,args[a++] != 0,this.getUnit(args[a++],this.WIDTH),this.getUnit(args[a++],this.HEIGHT));
                        break;
                     default:
                        trace("Invalid PathCommand type: " + command.type);
                        break loop1;
                  }
               }
            }
         }
      }
      
      public function moveToAbs(x:Number, y:Number) : void
      {
         this.cpoint = new Point(x,y);
         this.opoint = this.cpoint;
      }
      
      public function moveToRel(x:Number, y:Number) : void
      {
         this.moveToAbs(x + this.cpoint.x,y + this.cpoint.y);
      }
      
      public function lineToAbs(x:Number, y:Number) : void
      {
         var s:Segment = new Segment(this.cpoint,new Point(x,y));
         this.cpoint = s.p2;
         this.seglist.push(s);
      }
      
      public function lineToRel(x:Number, y:Number) : void
      {
         this.lineToAbs(x + this.cpoint.x,y + this.cpoint.y);
      }
      
      public function lineToHorizontalAbs(x:Number) : void
      {
         this.lineToAbs(x,this.cpoint.y);
      }
      
      public function lineToHorizontalRel(x:Number) : void
      {
         this.lineToHorizontalAbs(x + this.cpoint.x);
      }
      
      public function lineToVerticalAbs(y:Number) : void
      {
         this.lineToAbs(this.cpoint.x,y);
      }
      
      public function lineToVerticalRel(y:Number) : void
      {
         this.lineToVerticalAbs(y + this.cpoint.y);
      }
      
      public function curveToQuadraticAbs(x1:Number, y1:Number, x:Number, y:Number) : void
      {
         var s:QuadBezierSegment = new QuadBezierSegment(this.cpoint,new Point(x,y),new Point(x1,y1));
         this.cpoint = s.p2;
         this.seglist.push(s);
         this.lastC = new Point(x1,y1);
      }
      
      public function curveToQuadraticRel(control_x:Number, control_y:Number, anchor_x:Number, anchor_y:Number) : void
      {
         this.curveToQuadraticAbs(control_x + this.cpoint.x,control_y + this.cpoint.y,anchor_x + this.cpoint.x,anchor_y + this.cpoint.y);
      }
      
      public function curveToQuadraticSmoothAbs(x:Number, y:Number) : void
      {
         var x1:Number = NaN;
         var y1:Number = NaN;
         if(this.lastC)
         {
            x1 = this.cpoint.x + (this.cpoint.x - this.lastC.x);
            y1 = this.cpoint.y + (this.cpoint.y - this.lastC.y);
            this.curveToQuadraticAbs(x1,y1,x,y);
            this.lastC = new Point(x1,y1);
         }
      }
      
      public function curveToQuadraticSmoothRel(x:Number, y:Number) : void
      {
         this.curveToQuadraticSmoothAbs(x + this.cpoint.x,y + this.cpoint.y);
      }
      
      public function cubicCurveToAbs(x1:Number, y1:Number, x2:Number, y2:Number, x:Number, y:Number) : void
      {
         var s:CubicBezierSegment = new CubicBezierSegment(this.cpoint,new Point(x,y),new Point(x1,y1),new Point(x2,y2));
         this.cpoint = s.p2;
         this.seglist.push(s);
         this.lastC = new Point(x2,y2);
      }
      
      public function cubicCurveToRel(x1:Number, y1:Number, x2:Number, y2:Number, x:Number, y:Number) : void
      {
         this.cubicCurveToAbs(x1 + this.cpoint.x,y1 + this.cpoint.y,x2 + this.cpoint.x,y2 + this.cpoint.y,x + this.cpoint.x,y + this.cpoint.y);
      }
      
      public function curveToCubicSmoothAbs(x2:Number, y2:Number, x:Number, y:Number) : void
      {
         var x1:Number = NaN;
         var y1:Number = NaN;
         if(this.lastC)
         {
            x1 = this.cpoint.x + (this.cpoint.x - this.lastC.x);
            y1 = this.cpoint.y + (this.cpoint.y - this.lastC.y);
            this.cubicCurveToAbs(x1,y1,x2,y2,x,y);
         }
      }
      
      public function curveToCubicSmoothRel(x2:Number, y2:Number, x:Number, y:Number) : void
      {
         this.curveToCubicSmoothAbs(x2 + this.cpoint.x,y2 + this.cpoint.y,x + this.cpoint.x,y + this.cpoint.y);
      }
      
      public function arcAbs(rx:Number, ry:Number, angle:Number, largeArcFlag:Boolean, sweepFlag:Boolean, x:Number, y:Number) : void
      {
         var s:ArcSegment = new ArcSegment(this.cpoint,new Point(x,y),rx,ry,angle,largeArcFlag,sweepFlag);
         this.cpoint = s.p2;
         this.seglist.push(s);
      }
      
      public function arcRel(rx:Number, ry:Number, xAxisRotation:Number, largeArcFlag:Boolean, sweepFlag:Boolean, x:Number, y:Number) : void
      {
         this.arcAbs(rx,ry,xAxisRotation,largeArcFlag,sweepFlag,x + this.cpoint.x,y + this.cpoint.y);
      }
      
      private function closePath() : void
      {
         var oseg:Segment = null;
         var cseg:Segment = null;
         var i:int = 0;
         var s:Segment = null;
         if(this.cpoint.equals(this.opoint))
         {
            oseg = null;
            cseg = null;
            for(i = 0; i < this.seglist.length; i++)
            {
               if(this.seglist[i].p2 == this.cpoint)
               {
                  cseg = this.seglist[i];
               }
               if(this.seglist[i].p1 == this.opoint)
               {
                  oseg = this.seglist[i];
               }
            }
            if(oseg != null && cseg != null)
            {
               cseg.p2 = oseg.p1;
            }
         }
         else
         {
            s = new Segment(this.cpoint,this.opoint);
            this.cpoint = this.opoint;
            this.seglist.push(s);
         }
      }
      
      public function getUnit(s:String, viewBoxReference:String = "") : Number
      {
         return this.parent.getUnit(s,viewBoxReference);
      }
   }
}

