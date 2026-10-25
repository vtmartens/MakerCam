package com.partkart
{
   import com.greenthreads.*;
   import flash.display.BitmapData;
   import flash.geom.Point;
   
   public class CutObject extends GreenThread
   {
      
      public var pathlist:Array;
      
      public var active:* = false;
      
      protected var cutlist:Array;
      
      public var docx:Number = 0;
      
      public var docy:Number = 0;
      
      public var processed:Boolean = false;
      
      public var rootpath:CutPath;
      
      public var safetyheight:Number;
      
      public var stocksurface:Number;
      
      public var targetdepth:Number;
      
      public var stepover:Number;
      
      public var stepdown:Number;
      
      public var feedrate:Number;
      
      public var plungerate:Number;
      
      public var tooldiameter:Number;
      
      public var roughingclearance:Number;
      
      public var outside:Boolean = true;
      
      public var center:Boolean = true;
      
      public var spacing:Number = 0;
      
      public var dir:int = 1;
      
      public function CutObject()
      {
         super(false);
      }
      
      override protected function initialize() : void
      {
         var inputpath:Path = null;
         var seglist:Array = null;
         var cutpath:CutPath = null;
         this.processed = true;
         if(Boolean(this.rootpath) && this.contains(this.rootpath))
         {
            removeChild(this.rootpath);
         }
         this.docx = 0;
         this.docy = 0;
         x = 0;
         y = 0;
         this.cutlist = new Array();
         this.rootpath = new CutPath();
         addChild(this.rootpath);
         for each(inputpath in this.pathlist)
         {
            seglist = inputpath.linearize(true);
            if(seglist.length > 0)
            {
               cutpath = new CutPath();
               cutpath.parentpath = inputpath;
               cutpath.addSegments(seglist);
               cutpath.docx = inputpath.docx;
               cutpath.docy = inputpath.docy;
               cutpath.redraw();
               this.rootpath.addChild(cutpath);
               this.cutlist.push(cutpath);
            }
         }
      }
      
      public function group() : Array
      {
         var index:int = 0;
         var j:int = 0;
         this.rootpath.nestPaths();
         var parentpaths:Array = new Array();
         for(var i:int = 0; i < this.rootpath.numChildren; i++)
         {
            if(this.rootpath.getChildAt(i) is CutPath)
            {
               parentpaths.push(this.rootpath.getChildAt(i));
            }
         }
         var children:Array = this.rootpath.getChildren();
         var groups:Array = new Array();
         for(i = 0; i < parentpaths.length; i++)
         {
            groups.push(new Array(parentpaths[i].parentpath));
         }
         for(i = 0; i < children.length; i++)
         {
            index = parentpaths.indexOf(children[i]);
            if(index == -1)
            {
               for(j = 0; j < parentpaths.length; j++)
               {
                  if(parentpaths[j].contains(children[i]))
                  {
                     index = j;
                     break;
                  }
               }
               if(index != -1)
               {
                  groups[index].push(children[i].parentpath);
               }
            }
         }
         return groups;
      }
      
      public function redraw() : void
      {
      }
      
      public function setActive() : void
      {
         var cutlist:Array = null;
         var cutpath:CutPath = null;
         if(this.processed == true && Global.viewcuts == false)
         {
            this.active = true;
            cutlist = this.rootpath.getChildren();
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  cutpath.setActive();
               }
            }
         }
      }
      
      public function setInactive() : void
      {
         var cutlist:Array = null;
         var cutpath:CutPath = null;
         if(this.processed == true && Global.viewcuts == false)
         {
            this.active = false;
            cutlist = this.rootpath.getChildren();
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  cutpath.setInactive();
               }
            }
         }
      }
      
      public function inchToCm() : void
      {
         this.unitConvert(2.54);
         this.paramsInchToCm();
      }
      
      public function paramsInchToCm() : void
      {
         this.safetyheight *= 25.4;
         this.stocksurface *= 25.4;
         this.targetdepth *= 25.4;
         this.stepdown *= 25.4;
         this.feedrate *= 25.4;
         this.tooldiameter *= 2.54;
         this.roughingclearance *= 2.54;
      }
      
      public function cmToInch() : void
      {
         this.unitConvert(1 / 2.54);
         this.paramsCmToInch();
      }
      
      public function paramsCmToInch() : void
      {
         this.safetyheight /= 25.4;
         this.stocksurface /= 25.4;
         this.targetdepth /= 25.4;
         this.stepdown /= 25.4;
         this.feedrate /= 25.4;
         this.tooldiameter /= 2.54;
         this.roughingclearance /= 2.54;
      }
      
      protected function unitConvert(factor:Number) : void
      {
         var cutpath:CutPath = null;
         this.docx *= factor;
         this.docy *= factor;
         var children:Array = this.rootpath.getChildren();
         for each(cutpath in children)
         {
            if(cutpath != null)
            {
               cutpath.unitConvert(factor);
            }
         }
      }
      
      protected function drawBlank(linethickness:Number, linecolor:uint, linealpha:Number, fillcolor:uint, fillalpha:Number, fillbitmap:BitmapData = null) : void
      {
         var cutpath:CutPath = null;
         var seg:* = undefined;
         var children:Array = this.rootpath.getChildren();
         if(children.length > 0)
         {
            this.graphics.lineStyle(linethickness,linecolor,linealpha);
            if(fillbitmap)
            {
               this.graphics.beginBitmapFill(fillbitmap);
            }
            else
            {
               this.graphics.beginFill(fillcolor,fillalpha);
            }
            for each(cutpath in children)
            {
               this.graphics.moveTo((cutpath.seglist[0].p1.x + cutpath.docx) * Global.zoom,(-cutpath.seglist[0].p1.y + cutpath.docy) * Global.zoom);
               for each(seg in cutpath.seglist)
               {
                  if(seg is CircularArc)
                  {
                     cutpath.renderFillArc(new CircularArc(new Point(seg.p1.x + cutpath.docx,seg.p1.y - cutpath.docy),new Point(seg.p2.x + cutpath.docx,seg.p2.y - cutpath.docy),new Point(seg.center.x + cutpath.docx,seg.center.y - cutpath.docy),seg.radius),Global.zoom,3,true,this);
                  }
                  else
                  {
                     cutpath.renderFillLine(new Segment(new Point(seg.p1.x + cutpath.docx,seg.p1.y - cutpath.docy),new Point(seg.p2.x + cutpath.docx,seg.p2.y - cutpath.docy)),Global.zoom,true,this);
                  }
               }
               cutpath.graphics.clear();
            }
            this.graphics.endFill();
         }
      }
      
      public function zeroOrigin() : void
      {
         var i:int = 0;
         if(this.pathlist)
         {
            for(i = 0; i < this.pathlist.length; i++)
            {
               this.pathlist[i].zeroOrigin();
            }
         }
         this.docx = 0;
         this.docy = 0;
         x = 0;
         y = 0;
      }
      
      public function removeActiveTabs() : void
      {
         var children:Array = this.rootpath.getChildren();
         for(var i:int = 0; i < children.length; i++)
         {
            children[i].removeActiveTabs();
         }
      }
   }
}

