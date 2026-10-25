package com.partkart
{
   import flash.geom.Point;
   
   public class SVGWriter
   {
      
      private var pathlist:Array;
      
      private var cutlist:Array;
      
      private var svg:String;
      
      private var maxx:Number;
      
      private var maxy:Number;
      
      public function SVGWriter(inputpaths:Array, inputcuts:Array)
      {
         super();
         this.pathlist = inputpaths;
         this.cutlist = inputcuts;
      }
      
      public function parse() : String
      {
         var max:Point = null;
         var min:Point = null;
         var path:Path = null;
         this.maxx = 0;
         this.maxy = 0;
         var minx:Number = 0;
         var miny:Number = 0;
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            max = this.pathlist[i].getMax();
            min = this.pathlist[i].getMin();
            if(max.x > this.maxx)
            {
               this.maxx = max.x;
            }
            if(max.y > this.maxy)
            {
               this.maxy = max.y;
            }
            if(min.x < minx)
            {
               minx = min.x;
            }
            if(min.y < miny)
            {
               miny = min.y;
            }
         }
         this.maxx -= minx;
         this.maxy -= miny;
         for(i = 0; i < this.pathlist.length; i++)
         {
            this.pathlist[i].name = "path" + i;
         }
         this.svg = "<?xml version=\'1.0\'?>\n<!DOCTYPE svg PUBLIC \'-//W3C//DTD SVG 1.1//EN\' \'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\'>\n<svg xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' width=\'" + this.maxx + Global.unit + "\' height=\'" + this.maxy + Global.unit + "\' viewBox=\'0 0 " + this.maxx + " " + this.maxy + "\'>";
         if(Boolean(this.cutlist) && this.cutlist.length > 0)
         {
            this.svg += "\n<metadata>\n";
            for(i = 0; i < this.cutlist.length; i++)
            {
               this.svg += "<cutobject ";
               this.svg += "type=\"";
               if(this.cutlist[i] is ProfileCutObject)
               {
                  this.svg += "profile";
               }
               else if(this.cutlist[i] is PocketCutObject)
               {
                  this.svg += "pocket";
               }
               else if(this.cutlist[i] is FollowPathCutObject)
               {
                  this.svg += "followpath";
               }
               else if(this.cutlist[i] is DrillCutObject)
               {
                  this.svg += "drill";
               }
               this.svg += "\" ";
               this.svg += "unit=\"" + (Global.unit == "in" ? "imperial" : "metric") + "\" ";
               this.svg += "name=\"" + escape(this.cutlist[i].name) + "\" ";
               this.svg += "safetyheight=\"" + this.cutlist[i].safetyheight + "\" ";
               this.svg += "stocksurface=\"" + this.cutlist[i].stocksurface + "\" ";
               this.svg += "targetdepth=\"" + this.cutlist[i].targetdepth + "\" ";
               this.svg += "stepover=\"" + this.cutlist[i].stepover + "\" ";
               this.svg += "stepdown=\"" + this.cutlist[i].stepdown + "\" ";
               this.svg += "feedrate=\"" + this.cutlist[i].feedrate + "\" ";
               this.svg += "plungerate=\"" + this.cutlist[i].plungerate + "\" ";
               this.svg += "tooldiameter=\"" + this.cutlist[i].tooldiameter + "\" ";
               this.svg += "roughingclearance=\"" + this.cutlist[i].roughingclearance + "\" ";
               this.svg += "outside=\"" + (this.cutlist[i].outside == true ? "true" : "false") + "\" ";
               this.svg += "direction=\"" + this.cutlist[i].dir + "\" ";
               if(this.cutlist[i] is DrillCutObject)
               {
                  this.svg += "center=\"" + (this.cutlist[i].center == true ? "true" : "false") + "\" ";
                  this.svg += "spacing=\"" + this.cutlist[i].spacing + "\" ";
               }
               this.svg += ">\n";
               for each(path in this.cutlist[i].pathlist)
               {
                  this.svg += "<path>" + path.name + "</path>\n";
               }
               this.svg += "</cutobject>" + "\n";
            }
            this.svg += "</metadata>\n";
         }
         for(i = 0; i < this.pathlist.length; i++)
         {
            this.parsePath(this.pathlist[i]);
         }
         this.svg += "\n</svg>";
         return this.svg;
      }
      
      private function parsePath(p:Path) : void
      {
         var found:Boolean = false;
         var i:int = 0;
         this.svg += "\n<path id=\'" + p.name + "\' stroke=\'black\' fill=\'none\' stroke-width=\'0.02\' d=\'";
         var seglist:Array = p.getSegments();
         var origin:Point = seglist[0].p1;
         var next:Point = seglist[0].p2;
         var seg:Segment = seglist[0];
         this.svg += "M" + (origin.x + p.docx);
         this.svg += " " + (-origin.y + p.docy + this.maxy);
         while(seglist.length > 0)
         {
            if(seg is QuadBezierSegment)
            {
               this.svg += this.parseQuad(p,seg as QuadBezierSegment,next);
            }
            else if(seg is CubicBezierSegment)
            {
               this.svg += this.parseCubic(p,seg as CubicBezierSegment,next);
            }
            else if(seg is ArcSegment)
            {
               this.svg += this.parseArc(p,seg as ArcSegment,next);
            }
            else
            {
               this.svg += this.parseLine(p,next);
            }
            seglist.splice(seglist.indexOf(seg),1);
            if(seglist.length > 0)
            {
               found = false;
               for(i = 0; i < seglist.length; i++)
               {
                  if(seglist[i].p1 == next)
                  {
                     seg = seglist[i];
                     next = seglist[i].p2;
                     found = true;
                     break;
                  }
                  if(seglist[i].p2 == next)
                  {
                     seg = seglist[i];
                     next = seglist[i].p1;
                     found = true;
                     break;
                  }
               }
               if(found == false)
               {
                  if(next == origin)
                  {
                     this.svg += " Z";
                  }
                  seg = seglist[0];
                  this.svg += " M" + (seglist[0].p1.x + p.docx);
                  this.svg += " " + (-seglist[0].p1.y + p.docy + this.maxy);
                  origin = seglist[0].p1;
                  next = seglist[0].p2;
               }
            }
            else if(next == origin)
            {
               this.svg += " Z";
            }
         }
         this.svg += "\'/>";
      }
      
      private function parseLine(p:Path, next:Point) : String
      {
         var line:String = " L";
         line += next.x + p.docx;
         return line + (" " + (-next.y + p.docy + this.maxy));
      }
      
      private function parseQuad(p:Path, seg:QuadBezierSegment, next:Point) : String
      {
         var s:String = " Q";
         s += seg.c1.x + p.docx;
         s += " " + (-seg.c1.y + p.docy + this.maxy);
         s += " " + (next.x + p.docx);
         return s + (" " + (-next.y + p.docy + this.maxy));
      }
      
      private function parseCubic(p:Path, seg:CubicBezierSegment, next:Point) : String
      {
         var c1:Point = null;
         var c2:Point = null;
         var s:String = " C";
         if(seg.p2 == next)
         {
            c1 = seg.c1;
            c2 = seg.c2;
         }
         else
         {
            c1 = seg.c2;
            c2 = seg.c1;
         }
         s += c1.x + p.docx;
         s += " " + (-c1.y + p.docy + this.maxy);
         s += " " + (c2.x + p.docx);
         s += " " + (-c2.y + p.docy + this.maxy);
         s += " " + (next.x + p.docx);
         return s + (" " + (-next.y + p.docy + this.maxy));
      }
      
      private function parseArc(p:Path, seg:ArcSegment, next:Point) : String
      {
         var a:String = " A";
         a += seg.rx;
         a += " " + String(-seg.ry);
         a += " " + String(-seg.angle);
         if(seg.lf == true)
         {
            a += " 1";
         }
         else
         {
            a += " 0";
         }
         if(seg.p2 == next)
         {
            if(seg.sf == false)
            {
               a += " 1";
            }
            else
            {
               a += " 0";
            }
         }
         else if(seg.sf == true)
         {
            a += " 1";
         }
         else
         {
            a += " 0";
         }
         a += " " + (next.x + p.docx);
         return a + (" " + (-next.y + p.docy + this.maxy));
      }
   }
}

