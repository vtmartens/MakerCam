package com.partkart
{
   import com.lorentz.SVG.*;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.events.IOErrorEvent;
   import flash.net.FileFilter;
   import flash.net.FileReference;
   
   public class SVGLoader
   {
      
      private static const FILE_TYPES:Array = [new FileFilter("SVG File","*.svg;*.xml")];
      
      private var fr:FileReference;
      
      public var svg_object:Object;
      
      private var main:Object;
      
      private var svg:XML;
      
      public var clean:Boolean = true;
      
      public function SVGLoader(m:Object)
      {
         super();
         this.main = m;
      }
      
      public function load(svginput:* = null) : void
      {
         if(svginput == null)
         {
            this.fr = new FileReference();
            this.fr.addEventListener(Event.SELECT,this.onFileSelect);
            this.fr.addEventListener(Event.CANCEL,this.onCancel);
            this.fr.browse(FILE_TYPES);
         }
         else
         {
            XML.ignoreWhitespace = false;
            this.svg = new XML(svginput);
            XML.ignoreWhitespace = true;
            this.processSvg();
         }
      }
      
      private function onFileSelect(e:Event) : void
      {
         this.fr.addEventListener(Event.COMPLETE,this.onLoadComplete);
         this.fr.addEventListener(IOErrorEvent.IO_ERROR,this.onLoadError);
         this.fr.load();
      }
      
      private function onLoadComplete(e:Event) : void
      {
         XML.ignoreWhitespace = false;
         this.svg = new XML(this.fr.data);
         XML.ignoreWhitespace = true;
         this.processSvg();
      }
      
      private function processSvg() : void
      {
         var parser:SVGParser = null;
         var dispatcher:EventDispatcher = null;
         if(!this.svg.hasComplexContent())
         {
            this.main.startDialog(160,50,new Array({
               "type":"label",
               "label":"Could not read SVG file"
            }),"error");
         }
         else
         {
            parser = new SVGParser(this.svg);
            this.svg_object = parser.parse();
            if(this.svg_object == null)
            {
               this.main.startDialog(160,50,new Array({
                  "type":"label",
                  "label":"Could not read SVG file"
               }),"error");
            }
            else
            {
               this.main.processFile(this.svg_object,this.svg,this.clean);
               this.fr = null;
               dispatcher = new EventDispatcher();
               dispatcher.dispatchEvent(new Event(Event.COMPLETE));
            }
         }
      }
      
      private function onLoadError(e:IOErrorEvent) : void
      {
         var dispatcher:EventDispatcher = new EventDispatcher();
         dispatcher.dispatchEvent(e);
      }
      
      private function onCancel(e:Event) : void
      {
         this.fr = null;
      }
   }
}

