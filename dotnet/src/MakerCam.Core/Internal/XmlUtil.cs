using System.Xml.Linq;

namespace MakerCam.Core;

internal static class XmlUtil
{
    public static string LocalName(XElement el) => el.Name.LocalName.ToLowerInvariant();

    /// <summary>
    /// DOM <c>getAttribute</c>-style lookup: matches by local name regardless of
    /// namespace prefix (SVG files in the wild use both).
    /// </summary>
    public static string? Attr(XElement el, string name) =>
        el.Attributes().FirstOrDefault(a => a.Name.LocalName == name)?.Value;

    public static bool HasAttr(XElement el, string name) =>
        el.Attributes().Any(a => a.Name.LocalName == name);
}
