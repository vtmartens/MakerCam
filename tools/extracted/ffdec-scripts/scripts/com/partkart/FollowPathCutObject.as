package com.partkart
{
   public class FollowPathCutObject extends CutObject
   {
      
      public function FollowPathCutObject()
      {
         super();
      }
      
      override protected function run() : Boolean
      {
         var cutpath:CutPath = null;
         for each(cutpath in cutlist)
         {
            cutpath.makeContinuous();
            cutpath.clonePath();
            cutpath.joinSequence();
         }
         this.redraw();
         return false;
      }
      
      override public function redraw() : void
      {
         var path:Path = null;
         var cutlist:Array = null;
         var cutpath:CutPath = null;
         this.graphics.clear();
         if(processed == false)
         {
            this.graphics.lineStyle(tooldiameter * Global.zoom,16776960,0.3);
            for each(path in pathlist)
            {
               path.render(this);
            }
         }
         else
         {
            cutlist = rootpath.getChildren();
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  cutpath.renderClear();
                  if(Global.viewcuts == false)
                  {
                     cutpath.drawArrows(4);
                  }
                  else
                  {
                     cutpath.redrawCuts(tooldiameter);
                  }
               }
            }
         }
      }
      
      override public function group() : Array
      {
         var newcuts:Array = null;
         var cut:FollowPathCutObject = null;
         newcuts = new Array();
         for(var i:int = 0; i < pathlist.length; i++)
         {
            cut = this.clone();
            cut.name = this.name + "-" + i;
            cut.pathlist = new Array(pathlist[i]);
            newcuts.push(cut);
         }
         return newcuts;
      }
      
      protected function clone() : FollowPathCutObject
      {
         var newcut:FollowPathCutObject = new FollowPathCutObject();
         newcut.safetyheight = safetyheight;
         newcut.stocksurface = stocksurface;
         newcut.targetdepth = targetdepth;
         newcut.stepover = stepover;
         newcut.stepdown = stepdown;
         newcut.feedrate = feedrate;
         newcut.plungerate = plungerate;
         newcut.tooldiameter = tooldiameter;
         return newcut;
      }
      
      override public function setActive() : void
      {
         var cutlist:Array = null;
         var cutpath:CutPath = null;
         active = true;
         if(processed != false)
         {
            cutlist = rootpath.getChildren();
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  if(Global.viewcuts == false)
                  {
                     cutpath.drawArrows(6);
                  }
                  else
                  {
                     cutpath.redrawCuts(tooldiameter);
                  }
               }
            }
         }
      }
      
      override public function setInactive() : void
      {
         active = false;
         this.redraw();
      }
      
      public function drawNestBlank(color:uint = 0, gap:Number = 0) : void
      {
         var path:Path = null;
         this.graphics.clear();
         this.graphics.lineStyle((tooldiameter + gap) * Global.zoom,color,1);
         for each(path in pathlist)
         {
            path.render(this);
         }
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
      }
   }
}

