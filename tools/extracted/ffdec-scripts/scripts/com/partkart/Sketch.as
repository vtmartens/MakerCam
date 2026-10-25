package com.partkart
{
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Point;
   
   public class Sketch extends Sprite
   {
      
      private var pointlist:Array = new Array();
      
      private var angles:Array = new Array();
      
      private var lengthlist:Array = new Array();
      
      private var curvature:Array = new Array();
      
      private var timelist:Array = new Array();
      
      private var speedlist:Array = new Array();
      
      private var outputlist:Array = new Array();
      
      private var bezierlist:Array = new Array();
      
      private var avdis:Number = 0;
      
      public function Sketch(p:Point)
      {
         super();
         graphics.lineStyle(1,2911119,1,true,LineScaleMode.NONE);
         graphics.moveTo(p.x,p.y);
      }
      
      public function addPoint(p:Point) : void
      {
         this.pointlist.push(p);
      }
      
      public function addTime(n:int) : void
      {
         this.timelist.push(n);
      }
      
      public function lineTo(p:Point) : void
      {
         graphics.lineTo(p.x,p.y);
      }
      
      public function getPath() : Path
      {
         var path:Path = null;
         var s:Segment = null;
         var b:Array = null;
         var patharray:Array = null;
         var i:int = 0;
         var templen:int = 0;
         var isnull:Boolean = false;
         var j:int = 0;
         if(this.pointlist.length < 5)
         {
            return null;
         }
         this.processInput();
         if(this.outputlist.length > 1)
         {
            path = new Path();
            patharray = new Array();
            for(i = 0; i < this.outputlist.length - 1; i++)
            {
               s = new Segment(this.outputlist[i],this.outputlist[i + 1]);
               patharray.push(s);
            }
            templen = int(patharray.length);
            for(i = 0; i < templen; i++)
            {
               s = patharray[i];
               for(j = 0; j < this.bezierlist.length; j++)
               {
                  b = this.bezierlist[j];
                  if(s.p1.equals(b[0].p1) && s.p2.equals(b[b.length - 1].p2))
                  {
                     b[0].p1 = s.p1;
                     b[b.length - 1].p2 = s.p2;
                     patharray.splice(i,1,b);
                  }
                  else if(s.p1.equals(b[b.length - 1].p2) && s.p2.equals(b[0].p1))
                  {
                     b[b.length - 1].p2 = s.p1;
                     b[0].p1 = s.p2;
                     patharray.splice(i,1,b);
                  }
               }
            }
            if(patharray.length == 0)
            {
               return null;
            }
            isnull = true;
            for(i = 0; i < patharray.length; i++)
            {
               if(patharray[i] is Segment && !patharray[i].p1.equals(patharray[i].p2))
               {
                  isnull = false;
                  break;
               }
               if(patharray[i] is Array)
               {
                  for(j = 0; j < patharray[i].length; j++)
                  {
                     if(patharray[i][j] is Segment && !patharray[i][j].p1.equals(patharray[i][j].p2))
                     {
                        isnull = false;
                        break;
                     }
                  }
               }
            }
            if(isnull)
            {
               return null;
            }
            for(i = 0; i < patharray.length; i++)
            {
               if(patharray[i] is Segment)
               {
                  path.addSegment(patharray[i]);
               }
               else if(patharray[i] is Array)
               {
                  for(j = 0; j < patharray[i].length; j++)
                  {
                     path.addSegment(patharray[i][j]);
                  }
               }
            }
            return path;
         }
         return null;
      }
      
      private function processInput() : void
      {
         var a:Number = NaN;
         this.invertY();
         this.outputlist.push(this.pointlist[0]);
         for(var i:int = 0; i < this.pointlist.length - 1; i++)
         {
            this.avdis += Point.distance(this.pointlist[i],this.pointlist[i + 1]);
         }
         this.avdis /= this.pointlist.length - 1;
         trace("avdis: ",this.avdis);
         for(i = 0; i < this.pointlist.length; i++)
         {
            a = this.getAngle(i);
            this.angles.push(a);
         }
         this.processLength();
         this.processSpeed();
         this.processCurvature();
         this.addSpeed();
         this.processCurvatureFit();
         this.outputlist.push(this.pointlist[this.pointlist.length - 1]);
         this.proximityFilter();
         this.beautify();
         this.fitBeziers();
         this.scaleOutput();
         this.remDoubles();
         trace("done");
      }
      
      private function invertY() : void
      {
         var p:* = undefined;
         for each(p in this.pointlist)
         {
            p.y = -p.y;
         }
      }
      
      private function beautify() : void
      {
         var angobj:* = undefined;
         var angle:* = undefined;
         var j:int = 0;
         var tempang:Number = NaN;
         var group1:Array = null;
         var group2:Array = null;
         var added:Boolean = false;
         var k:int = 0;
         var group:Array = null;
         var median:Number = NaN;
         var a:Object = null;
         var b:Object = null;
         var len1:Number = NaN;
         var len2:Number = NaN;
         var mid1:Point = null;
         var mid2:Point = null;
         var ext1:Point = null;
         var ext2:Point = null;
         var intersect:Point = null;
         var ext3:Point = null;
         var ext4:Point = null;
         var anglist:Array = new Array();
         for(var i:int = 0; i < this.outputlist.length - 1; i++)
         {
            angobj = new Object();
            angle = Math.atan2(this.outputlist[i + 1].y - this.outputlist[i].y,this.outputlist[i + 1].x - this.outputlist[i].x) * 180 / Math.PI;
            angobj.angle = angle;
            angobj.p1 = this.outputlist[i];
            angobj.p2 = this.outputlist[i + 1];
            anglist.push(angobj);
         }
         var grouplist:Array = new Array();
         var anglelimit:Number = 6;
         for(i = 0; i < anglist.length; i++)
         {
            for(j = 0; j < anglist.length; j++)
            {
               tempang = this.angularDifference(anglist[i].angle,anglist[j].angle);
               if(i != j && this.angularDifference(anglist[i].angle,anglist[j].angle) < anglelimit)
               {
                  group1 = this.findIn(grouplist,anglist[i]);
                  group2 = this.findIn(grouplist,anglist[j]);
                  if(group1 == null && group2 == null)
                  {
                     added = false;
                     for(k = 0; k < grouplist.length; k++)
                     {
                        if(this.getAverageAngularDifference(grouplist[k],anglist[i].angle) < anglelimit)
                        {
                           grouplist[k].push(anglist[i]);
                           grouplist[k].push(anglist[j]);
                           added = true;
                           break;
                        }
                     }
                     if(added == false)
                     {
                        group = new Array();
                        group.push(anglist[i]);
                        group.push(anglist[j]);
                        grouplist.push(group);
                     }
                  }
                  else if(group1 != null && group2 == null)
                  {
                     group1.push(anglist[j]);
                  }
                  else if(group2 != null && group1 == null)
                  {
                     group2.push(anglist[i]);
                  }
               }
            }
         }
         for(i = 0; i < grouplist.length; i++)
         {
            if(this.getAverageAngularDifference(grouplist[i],0) < anglelimit)
            {
               for(j = 0; j < grouplist[i].length; j++)
               {
                  grouplist[i][j].angle = 0;
               }
            }
            else if(this.getAverageAngularDifference(grouplist[i],90) < anglelimit)
            {
               for(j = 0; j < grouplist[i].length; j++)
               {
                  grouplist[i][j].angle = 90;
               }
            }
            else
            {
               grouplist[i].sortOn("angle",Array.NUMERIC);
               median = Number(grouplist[i][Math.floor((grouplist[i].length - 1) / 2)].angle);
               for(j = 0; j < grouplist[i].length; j++)
               {
                  grouplist[i][j].angle = median;
               }
            }
         }
         trace(grouplist);
         for(i = 0; i < anglist.length - 1; i++)
         {
            a = anglist[i];
            b = anglist[i + 1];
            len1 = Point.distance(a.p1,a.p2) / 2;
            len2 = Point.distance(b.p1,b.p2) / 2;
            mid1 = new Point((a.p1.x + a.p2.x) / 2,(a.p1.y + a.p2.y) / 2);
            mid2 = new Point((b.p1.x + b.p2.x) / 2,(b.p1.y + b.p2.y) / 2);
            ext1 = new Point(mid1.x + len1 * Math.cos(a.angle * Math.PI / 180),mid1.y + len1 * Math.sin(a.angle * Math.PI / 180));
            ext2 = new Point(mid2.x + len2 * Math.cos(b.angle * Math.PI / 180),mid2.y + len2 * Math.sin(b.angle * Math.PI / 180));
            intersect = Global.lineIntersect(mid1,ext1,mid2,ext2);
            if(intersect != null && !isNaN(intersect.x) && !isNaN(intersect.y) && this.onScreen(intersect))
            {
               if(i == 0)
               {
                  ext4 = new Point(mid1.x - (ext1.x - mid1.x),mid1.y - (ext1.y - mid1.y));
                  if(Point.distance(intersect,ext1) < Point.distance(intersect,ext4))
                  {
                     a.p1.x = ext4.x;
                     a.p1.y = ext4.y;
                  }
                  else
                  {
                     a.p1.x = ext1.x;
                     a.p1.y = ext1.y;
                  }
               }
               a.p2.x = intersect.x;
               a.p2.y = intersect.y;
               ext3 = new Point(mid2.x - (ext2.x - mid2.x),mid2.y - (ext2.y - mid2.y));
               if(Point.distance(intersect,ext2) < Point.distance(intersect,ext3))
               {
                  b.p2.x = ext3.x;
                  b.p2.y = ext3.y;
               }
               else
               {
                  b.p2.x = ext2.x;
                  b.p2.y = ext2.y;
               }
            }
         }
      }
      
      private function onScreen(intersect:Point) : Boolean
      {
         if(intersect.x > Global.docwidth * 2 || intersect.x < -1 * Global.docwidth)
         {
            return false;
         }
         if(intersect.y > Global.docheight * 2 || intersect.y < -1 * Global.docheight)
         {
            return false;
         }
         return true;
      }
      
      private function findIn(list:Array, a:Object) : Array
      {
         for(var i:int = 0; i < list.length; i++)
         {
            if(list[i].indexOf(a) != -1)
            {
               return list[i];
            }
         }
         return null;
      }
      
      private function getAverageAngularDifference(a:Array, b:Number) : Number
      {
         var av:Number = 0;
         for(var i:int = 0; i < a.length; i++)
         {
            av += this.angularDifference(a[i].angle,b);
         }
         return av / a.length;
      }
      
      private function angularDifference(a:Number, b:Number) : Number
      {
         var diff:Number = a - b;
         var dlist:Array = new Array();
         dlist.push(Math.abs(diff));
         dlist.push(Math.abs(diff + 180));
         dlist.push(Math.abs(diff - 180));
         dlist.push(Math.abs(diff - 360));
         dlist.push(Math.abs(diff + 360));
         var smallest:Number = 90;
         for(var i:int = 0; i < dlist.length; i++)
         {
            if(dlist[i] < smallest)
            {
               smallest = Number(dlist[i]);
            }
         }
         return smallest;
      }
      
      private function signedAngularDifference(a:Number, b:Number) : Number
      {
         var diff:Number = a - b;
         var dlist:Array = new Array();
         dlist.push(Math.abs(diff));
         dlist.push(Math.abs(diff + 180));
         dlist.push(Math.abs(diff - 180));
         dlist.push(Math.abs(diff - 360));
         dlist.push(Math.abs(diff + 360));
         dlist.sort();
         return dlist[0];
      }
      
      private function scaleOutput() : void
      {
         for(var i:int = 0; i < this.outputlist.length; i++)
         {
            if(this.outputlist[i] is Point)
            {
               this.outputlist[i] = new Point(this.outputlist[i].x / Global.zoom,this.outputlist[i].y / Global.zoom);
            }
         }
      }
      
      private function getAngle(index:int) : Number
      {
         var p1:Point = null;
         var p2:Point = null;
         var a1:Number = NaN;
         var angle:Number = 0;
         var limit:int = -1 * this.avdis + 11;
         if(limit < 4)
         {
            limit = 4;
         }
         for(var i:int = 1; i < limit; i++)
         {
            if(this.pointlist[index - i])
            {
               p1 = this.pointlist[index - i];
            }
            else
            {
               p1 = this.pointlist[index];
            }
            if(this.pointlist[index + i])
            {
               p2 = this.pointlist[index + i];
            }
            else
            {
               p2 = this.pointlist[index];
            }
            a1 = Math.atan2(p2.y - p1.y,p2.x - p1.x) * 180 / Math.PI;
            angle += this.angularDifference(a1,0);
         }
         return angle / (limit - 1);
      }
      
      private function processLength() : void
      {
         for(var i:int = 0; i < this.pointlist.length - 1; i++)
         {
            this.lengthlist.push(Point.distance(this.pointlist[i],this.pointlist[i + 1]));
         }
      }
      
      private function processCurvature() : void
      {
         var c:Number = NaN;
         var c1:Number = NaN;
         for(var i:int = 0; i < this.angles.length - 1; i++)
         {
            c = (this.angles[i + 1] - this.angles[i]) / this.lengthlist[i];
            c1 = (this.angles[i + 1] + this.angles[i]) / this.lengthlist[i];
            if(Math.abs(c1) < Math.abs(c))
            {
               this.curvature.push(Math.abs(c1));
            }
            else
            {
               this.curvature.push(Math.abs(c));
            }
         }
      }
      
      private function processCurvatureFit() : void
      {
         var av:Number = 0;
         for(var i:int = 0; i < this.curvature.length; i++)
         {
            av += this.curvature[i];
         }
         av = 2.5 * av / this.curvature.length;
         var entered:Boolean = false;
         var peak:Object = {};
         for(i = 0; i < this.curvature.length; i++)
         {
            if(!entered && this.curvature[i] > av)
            {
               entered = true;
               peak.num = this.curvature[i];
               peak.index = i;
            }
            if(entered)
            {
               if(this.curvature[i] > peak.num)
               {
                  peak.num = this.curvature[i];
                  peak.index = i;
               }
               if(this.curvature[i] < av)
               {
                  entered = false;
                  this.outputlist.push(this.pointlist[peak.index]);
                  peak.num = 0;
               }
            }
         }
      }
      
      private function proximityFilter() : void
      {
         var newlist:Array = null;
         var radius:int = 0;
         var skipnext:Boolean = false;
         var i:int = 0;
         if(this.outputlist.length > 2)
         {
            newlist = new Array();
            radius = 5;
            skipnext = false;
            for(i = 0; i < this.outputlist.length - 1; i++)
            {
               if(skipnext == false)
               {
                  newlist.push(this.outputlist[i]);
               }
               else
               {
                  skipnext = false;
               }
               if(Math.abs(this.outputlist[i].x - this.outputlist[i + 1].x) < radius && Math.abs(this.outputlist[i].y - this.outputlist[i + 1].y) < radius)
               {
                  skipnext = true;
               }
            }
            if(skipnext == false)
            {
               newlist.push(this.outputlist[this.outputlist.length - 1]);
            }
            this.outputlist = newlist;
         }
      }
      
      private function processSpeed() : void
      {
         for(var i:int = 0; i < this.pointlist.length - 1; i++)
         {
            this.speedlist.push(Number(this.timelist[i] / (this.lengthlist[i] + 2)));
         }
         var av:Number = 0;
         for(i = 0; i < this.speedlist.length; i++)
         {
            av += this.speedlist[i];
         }
         av /= this.speedlist.length;
         for(i = 0; i < this.speedlist.length; i++)
         {
            this.speedlist[i] /= 0.5 * av;
         }
      }
      
      private function addSpeed() : void
      {
         for(var i:int = 0; i < this.pointlist.length - 1; i++)
         {
            this.curvature[i] += this.speedlist[i];
         }
      }
      
      private function fitBeziers() : void
      {
         var j:int = 0;
         var euclid:Number = NaN;
         var prevind:int = 0;
         var len:Number = 0;
         var error:Number = 0;
         var errorlist:Array = new Array();
         var tempind:int = 0;
         var errorlimit:Number = -0.01 * this.avdis + 1.3;
         if(errorlimit < 1.07)
         {
            errorlimit = 1.07;
         }
         var templen:int = int(this.outputlist.length);
         for(var i:int = 1; i < templen; i++)
         {
            tempind = prevind;
            for(j = prevind; j < this.pointlist.length; j++)
            {
               if(this.outputlist[i].equals(this.pointlist[j]))
               {
                  prevind = j;
                  break;
               }
               if(j < this.lengthlist.length)
               {
                  len += this.lengthlist[j];
               }
            }
            euclid = Point.distance(this.outputlist[i],this.outputlist[i - 1]);
            if(isNaN(euclid) || euclid == 0)
            {
               euclid = 0.0001;
            }
            error = len / euclid;
            len = 0;
            if(error > errorlimit)
            {
               this.bezierlist.push(this.bezierRecurs(tempind,prevind));
            }
            trace("error: ",error);
         }
      }
      
      private function remDoubles() : void
      {
         var b:Array = null;
         var j:int = 0;
         var k:int = 0;
         for(var i:int = 0; i < this.bezierlist.length; i++)
         {
            b = this.bezierlist[i];
            for(j = 0; j < b.length; j++)
            {
               for(k = 0; k < b.length; k++)
               {
                  if(Boolean(b[j].p1.equals(b[k].p2)) && b[j].p1 != b[k].p2)
                  {
                     b[k].p2 = b[j].p1;
                  }
               }
            }
         }
      }
      
      private function bezierRecurs(ind1:int, ind2:int, smooth:int = 0) : Array
      {
         var limit:int = 0;
         var con1:Point = null;
         var con2:Point = null;
         var con3:Point = null;
         var con4:Point = null;
         var lowest:Number = NaN;
         var temp:Number = NaN;
         var av:Number = NaN;
         var currentpoint:Point = null;
         var avind:int = 0;
         var j:int = 0;
         var returnarray:* = new Array();
         limit = (ind2 - ind1) / 3;
         var c1:Point = new Point(this.pointlist[ind1].x / Global.zoom,this.pointlist[ind1].y / Global.zoom);
         var c2:Point = new Point(this.pointlist[ind2].x / Global.zoom,this.pointlist[ind2].y / Global.zoom);
         var c1b:Point = new Point(0,0);
         var c2b:Point = new Point(0,0);
         var c1c:Point = new Point(0,0);
         var c2c:Point = new Point(0,0);
         var lim1:int = 0;
         var lim2:int = 0;
         var i:int = 0;
         if(ind2 - ind1 < 6)
         {
            avind = 0;
            avind = Math.floor((ind2 + ind1) / 2);
            returnarray.push(new QuadBezierSegment(c1,c2,new Point(this.pointlist[avind].x / Global.zoom,this.pointlist[avind].y / Global.zoom)));
            return returnarray;
         }
         switch(smooth)
         {
            case 0:
               for(i = 1; i <= limit; i++)
               {
                  if(this.pointlist[ind1 + i])
                  {
                     c1b = c1b.add(this.pointlist[ind1 + i]);
                     lim1++;
                  }
                  if(this.pointlist[ind2 - i])
                  {
                     c2b = c2b.add(this.pointlist[ind2 - i]);
                     lim2++;
                  }
               }
               break;
            case 1:
               for(i = 1; i <= limit; i++)
               {
                  if(this.pointlist[ind2 - i])
                  {
                     c2b = c2b.add(this.pointlist[ind2 - i]);
                     lim2++;
                  }
               }
               for(i = 1; i <= limit; i++)
               {
                  if(Boolean(this.pointlist[ind1 + i]) && Boolean(this.pointlist[ind1 - i]))
                  {
                     c1b = c1b.add(this.pointlist[ind1 + i]);
                     c1c = c1c.add(this.pointlist[ind1 - i]);
                     lim1++;
                  }
               }
               break;
            case 2:
               for(i = 1; i <= limit; i++)
               {
                  if(this.pointlist[ind1 + i])
                  {
                     c1b = c1b.add(this.pointlist[ind1 + i]);
                     lim1++;
                  }
               }
               for(i = 1; i <= limit; i++)
               {
                  if(Boolean(this.pointlist[ind2 - i]) && Boolean(this.pointlist[ind2 + i]))
                  {
                     c2b = c2b.add(this.pointlist[ind2 - i]);
                     c2c = c2c.add(this.pointlist[ind2 + i]);
                     lim2++;
                  }
               }
               break;
            case 3:
               for(i = 1; i <= limit; i++)
               {
                  if(Boolean(this.pointlist[ind1 + i]) && Boolean(this.pointlist[ind1 - i]))
                  {
                     c1b = c1b.add(this.pointlist[ind1 + i]);
                     c1c = c1c.add(this.pointlist[ind1 - i]);
                     lim1++;
                  }
                  if(Boolean(this.pointlist[ind2 - i]) && Boolean(this.pointlist[ind2 + i]))
                  {
                     c2b = c2b.add(this.pointlist[ind2 - i]);
                     c2c = c2c.add(this.pointlist[ind2 + i]);
                     lim2++;
                  }
               }
         }
         c1b.x /= lim1 * Global.zoom;
         c1b.y /= lim1 * Global.zoom;
         c2b.x /= lim2 * Global.zoom;
         c2b.y /= lim2 * Global.zoom;
         c1c.x /= lim1 * Global.zoom;
         c1c.y /= lim1 * Global.zoom;
         c2c.x /= lim2 * Global.zoom;
         c2c.y /= lim2 * Global.zoom;
         var control:Point = new Point(0,0);
         var conlim:int = 0;
         switch(smooth)
         {
            case 0:
               control = Global.lineIntersect(c1,c1b,c2,c2b);
               break;
            case 1:
               con1 = Global.lineIntersect(c1,c1b,c2,c2b);
               con2 = Global.lineIntersect(c1,c1c,c2,c2b);
               if(con1)
               {
                  control = control.add(con1);
                  conlim++;
               }
               if(con2)
               {
                  control = control.add(con2);
                  conlim++;
               }
               if(Boolean(con1) || Boolean(con2))
               {
                  control.x /= conlim;
                  control.y /= conlim;
               }
               else
               {
                  control = new Point(0,0);
                  control.x = this.pointlist[Math.floor((ind1 + ind2) / 2)].x / Global.zoom;
                  control.y = this.pointlist[Math.floor((ind1 + ind2) / 2)].y / Global.zoom;
               }
               break;
            case 2:
               con1 = Global.lineIntersect(c1,c1b,c2,c2b);
               con2 = Global.lineIntersect(c1,c1b,c2,c2c);
               if(con1)
               {
                  control = control.add(con1);
                  conlim++;
               }
               if(con2)
               {
                  control = control.add(con2);
                  conlim++;
               }
               if(Boolean(con1) || Boolean(con2))
               {
                  control.x /= conlim;
                  control.y /= conlim;
               }
               else
               {
                  control = new Point(0,0);
                  control.x = this.pointlist[Math.floor((ind1 + ind2) / 2)].x / Global.zoom;
                  control.y = this.pointlist[Math.floor((ind1 + ind2) / 2)].y / Global.zoom;
               }
               break;
            case 3:
               con1 = Global.lineIntersect(c1,c1b,c2,c2b);
               con2 = Global.lineIntersect(c1,c1c,c2,c2b);
               con3 = Global.lineIntersect(c1,c1b,c2,c2b);
               con4 = Global.lineIntersect(c1,c1b,c2,c2c);
               if(con1)
               {
                  control = control.add(con1);
                  conlim++;
               }
               if(con2)
               {
                  control = control.add(con2);
                  conlim++;
               }
               if(con3)
               {
                  control = control.add(con3);
                  conlim++;
               }
               if(con4)
               {
                  control = control.add(con4);
                  conlim++;
               }
               if(Boolean(con1) || Boolean(con2) || Boolean(con3) || Boolean(con4))
               {
                  control.x /= conlim;
                  control.y /= conlim;
               }
               else
               {
                  control = new Point(0,0);
                  control.x = this.pointlist[Math.floor((ind1 + ind2) / 2)].x / Global.zoom;
                  control.y = this.pointlist[Math.floor((ind1 + ind2) / 2)].y / Global.zoom;
               }
         }
         if(!control)
         {
            control = new Point(0,0);
            control.x = this.pointlist[Math.floor((ind1 + ind2) / 2)].x / Global.zoom;
            control.y = this.pointlist[Math.floor((ind1 + ind2) / 2)].y / Global.zoom;
         }
         trace(control);
         var bezier:QuadBezierSegment = new QuadBezierSegment(c1,c2,control);
         var starttime:Number = 0;
         var timelimit:int = 2 * Math.abs(ind2 - ind1);
         var total:Number = 0;
         for(i = ind1 + 1; i < ind2; i++)
         {
            starttime = (i - ind1) / (ind2 - ind1);
            currentpoint = new Point(this.pointlist[i].x / Global.zoom,this.pointlist[i].y / Global.zoom);
            lowest = Point.distance(bezier.getPoint(starttime),currentpoint);
            for(j = 0; j < timelimit; j++)
            {
               temp = Point.distance(bezier.getPoint(1 / timelimit * j),currentpoint);
               if(temp < lowest)
               {
                  lowest = temp;
               }
            }
            total += lowest;
         }
         av = total / (ind2 - ind1 - 1);
         if(av > 0.17)
         {
            switch(smooth)
            {
               case 0:
                  returnarray = returnarray.concat(this.bezierRecurs(ind1,ind1 + (ind2 - ind1) / 2,2));
                  returnarray = returnarray.concat(this.bezierRecurs(ind1 + (ind2 - ind1) / 2,ind2,1));
                  break;
               case 1:
                  returnarray = returnarray.concat(this.bezierRecurs(ind1,ind1 + (ind2 - ind1) / 2,3));
                  returnarray = returnarray.concat(this.bezierRecurs(ind1 + (ind2 - ind1) / 2,ind2,1));
                  break;
               case 2:
                  returnarray = returnarray.concat(this.bezierRecurs(ind1,ind1 + (ind2 - ind1) / 2,2));
                  returnarray = returnarray.concat(this.bezierRecurs(ind1 + (ind2 - ind1) / 2,ind2,3));
                  break;
               case 3:
                  returnarray = returnarray.concat(this.bezierRecurs(ind1,ind1 + (ind2 - ind1) / 2,3));
                  returnarray = returnarray.concat(this.bezierRecurs(ind1 + (ind2 - ind1) / 2,ind2,3));
            }
         }
         else
         {
            returnarray.push(bezier);
         }
         return returnarray;
      }
   }
}

