package com.partkart
{
   import flash.display.BitmapData;
   
   public class PocketCutObject extends CutObject
   {
      
      protected var offsetresult:Array;
      
      protected var offsetlist:Array;
      
      protected var iteration:int;
      
      public function PocketCutObject()
      {
         super();
      }
      
      override protected function initialize() : void
      {
         var max:Number = NaN;
         var path:Path = null;
         super.initialize();
         this.iteration = 0;
         _progress = 0;
         rootpath.nestPaths();
         rootpath.setChildrenDirection(1);
         this.offsetresult = new Array();
         rootpath.pocketdepth = this.iteration;
         this.offsetlist = rootpath.offset(cutlist,0.5 * tooldiameter + roughingclearance);
         this.offsetresult = this.offsetresult.concat(this.offsetlist);
         if(isNaN(_maximum))
         {
            max = 0;
            for each(path in pathlist)
            {
               if(path.width > max)
               {
                  max = path.width;
               }
               if(path.height > max)
               {
                  max = path.height;
               }
            }
            max /= Global.zoom;
            _maximum = 0.5 * (max / (stepover * tooldiameter));
         }
      }
      
      override protected function run() : Boolean
      {
         var cutpath:CutPath = null;
         var newoffsetlist:Array = null;
         var newcutpath:CutPath = null;
         ++this.iteration;
         _progress = this.iteration;
         for each(cutpath in this.offsetlist)
         {
            cutpath.pocketdepth = this.iteration;
         }
         newoffsetlist = new Array();
         for each(cutpath in this.offsetlist)
         {
            newcutpath = new CutPath();
            newcutpath.seglist = cutpath.seglist;
            newoffsetlist.push(newcutpath);
         }
         rootpath.pocketdepth = this.iteration;
         this.offsetlist = rootpath.offset(newoffsetlist,stepover * tooldiameter,true);
         this.offsetresult = this.offsetresult.concat(this.offsetlist);
         if(this.offsetlist.length == 0)
         {
            this.finish();
            return false;
         }
         return true;
      }
      
      protected function finish() : void
      {
         var cutpath:CutPath = null;
         for each(cutpath in this.offsetresult)
         {
            rootpath.addChild(cutpath);
         }
         for each(cutpath in this.offsetresult)
         {
            cutpath.setDirection(dir);
            cutpath.resetSegments();
         }
         rootpath.nestPaths();
         rootpath.rotateChildren();
         cutlist = null;
         _maximum = this.iteration;
         this.redraw();
      }
      
      override public function redraw() : void
      {
         var path:Path = null;
         var hatch:BitmapData = null;
         var cutlist:Array = null;
         var prev:CutPath = null;
         var cutpath:CutPath = null;
         var depthdiff:int = 0;
         this.graphics.clear();
         if(this.rootpath == null)
         {
            super.initialize();
            processed = false;
         }
         if(processed == false)
         {
            for each(path in pathlist)
            {
               if(path.dirty == true)
               {
                  while(numChildren > 0)
                  {
                     removeChildAt(0);
                  }
                  super.initialize();
                  processed = false;
                  docx = 0;
                  docy = 0;
                  x = 0;
                  y = 0;
                  break;
               }
            }
            hatch = new BitmapData(6,6,true,0);
            if(active == false)
            {
               hatch.floodFill(0,0,1157627648);
            }
            else
            {
               hatch.floodFill(0,0,1140907519);
            }
            hatch.setPixel32(0,0,4278190080);
            hatch.setPixel32(1,1,4278190080);
            hatch.setPixel32(2,2,4278190080);
            hatch.setPixel32(3,3,4278190080);
            hatch.setPixel32(4,4,4278190080);
            hatch.setPixel32(5,5,4278190080);
            drawBlank(2,16776960,0.1,16776960,0.3,hatch);
            rootpath.visible = false;
         }
         else
         {
            cutlist = rootpath.getChildren();
            prev = cutlist[0];
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  if(Global.viewcuts == false)
                  {
                     cutpath.redraw();
                     cutpath.drawStartArrow();
                  }
                  else
                  {
                     cutpath.redrawCuts(tooldiameter);
                     depthdiff = cutpath.pocketdepth - prev.pocketdepth;
                     if(prev != cutpath && (depthdiff == -1 || depthdiff == 1) && prev.parent == cutpath && cutpath.getNumChildren() == 1)
                     {
                        cutpath.redrawStartCut(prev.seglist[0].p1);
                     }
                     prev = cutpath;
                  }
               }
            }
         }
      }
      
      override public function group() : Array
      {
         var cut:PocketCutObject = null;
         super.initialize();
         var groups:Array = super.group();
         var newcuts:Array = new Array();
         for(var i:int = 0; i < groups.length; i++)
         {
            cut = this.clone();
            cut.name = this.name + "-" + i;
            cut.pathlist = groups[i];
            newcuts.push(cut);
         }
         return newcuts;
      }
      
      protected function clone() : PocketCutObject
      {
         var newcut:PocketCutObject = null;
         newcut = new PocketCutObject();
         newcut.safetyheight = safetyheight;
         newcut.stocksurface = stocksurface;
         newcut.targetdepth = targetdepth;
         newcut.stepover = stepover;
         newcut.stepdown = stepdown;
         newcut.feedrate = feedrate;
         newcut.plungerate = plungerate;
         newcut.tooldiameter = tooldiameter;
         newcut.roughingclearance = roughingclearance;
         newcut.dir = dir;
         return newcut;
      }
      
      public function drawNestBlank(color:uint = 0, gap:Number = 0) : void
      {
         this.graphics.clear();
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
         super.initialize();
         drawBlank(gap * Global.zoom / 2 + 1,color,1,color,1);
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
         rootpath.visible = false;
      }
      
      override public function setActive() : void
      {
         if(processed == false)
         {
            active = true;
            this.redraw();
         }
         else
         {
            super.setActive();
         }
      }
      
      override public function setInactive() : void
      {
         if(processed == false)
         {
            active = false;
            this.redraw();
         }
         else
         {
            super.setInactive();
         }
      }
   }
}

