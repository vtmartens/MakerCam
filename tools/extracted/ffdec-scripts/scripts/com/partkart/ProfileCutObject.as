package com.partkart
{
   public class ProfileCutObject extends CutObject
   {
      
      public function ProfileCutObject()
      {
         super();
      }
      
      override protected function run() : Boolean
      {
         var offset:Number = NaN;
         var cutpath:CutPath = null;
         rootpath.nestPaths();
         rootpath.setChildrenDirection(1);
         if(outside == true)
         {
            offset = -0.5 * tooldiameter;
         }
         else
         {
            offset = 0.5 * tooldiameter;
         }
         var offsetlist:Array = rootpath.offset(cutlist,offset);
         for each(cutpath in offsetlist)
         {
            rootpath.addChild(cutpath);
         }
         for each(cutpath in offsetlist)
         {
            cutpath.setDirection(dir);
            cutpath.resetSegments();
         }
         rootpath.nestPaths();
         cutlist = null;
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
            if(active)
            {
               drawBlank(2,56831,0.1,56831,0.3);
            }
            else
            {
               drawBlank(2,16776960,0.1,16776960,0.3);
            }
            rootpath.visible = false;
         }
         else
         {
            rootpath.visible = true;
            cutlist = rootpath.getChildren();
            for each(cutpath in cutlist)
            {
               if(cutpath != null)
               {
                  if(Global.viewcuts == false)
                  {
                     cutpath.redraw();
                     cutpath.redrawTabs();
                     cutpath.drawStartArrow();
                  }
                  else
                  {
                     cutpath.redrawCuts(tooldiameter);
                  }
               }
            }
            rootpath.visible = true;
         }
      }
      
      override public function group() : Array
      {
         var cut:ProfileCutObject = null;
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
      
      protected function clone() : ProfileCutObject
      {
         var newcut:ProfileCutObject = new ProfileCutObject();
         newcut.safetyheight = safetyheight;
         newcut.stocksurface = stocksurface;
         newcut.targetdepth = targetdepth;
         newcut.stepover = stepover;
         newcut.stepdown = stepdown;
         newcut.feedrate = feedrate;
         newcut.plungerate = plungerate;
         newcut.tooldiameter = tooldiameter;
         newcut.roughingclearance = roughingclearance;
         newcut.outside = outside;
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
         drawBlank((2 * tooldiameter + gap) * Global.zoom,color,1,color,1);
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
      
      public function addTabs(tabspacing:Number, tabwidth:Number, tabheight:Number) : int
      {
         var cutpath:CutPath = null;
         var cutlist:Array = rootpath.getChildren();
         var count:int = 0;
         for each(cutpath in cutlist)
         {
            count += cutpath.addTabs(tabspacing,tabwidth,tabheight,tooldiameter);
         }
         this.redraw();
         return count;
      }
   }
}

