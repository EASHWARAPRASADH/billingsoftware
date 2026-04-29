import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/config/supabase";
import { storageService } from "@/services/storageService";
import { Save, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    email: "",
    phone: "",
    address: "",
    tax_rate: "0",
    currency: "INR",
    logo: "",
    signature: ""
  });
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          business_name: data.company_name || "",
          email: data.company_email || "",
          phone: data.company_phone || "",
          address: data.company_address || "",
          tax_rate: "0", // Not currently in DB schema
          currency: "INR", // Not currently in DB schema
          logo: data.company_logo || "",
          signature: data.signature_image || ""
        });
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }

    try {
      let result;
      if (type === 'logo') {
        result = await storageService.uploadCompanyLogo(file);
      } else {
        result = await storageService.uploadSignature(file);
      }

      if (result.error) throw result.error;

      setFormData({ ...formData, [type]: result.url });
      toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    }
  };

  const removeImage = (type) => {
    setFormData({ ...formData, [type]: "" });
    if (type === 'logo' && logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    if (type === 'signature' && signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        company_name: formData.business_name,
        company_email: formData.email,
        company_phone: formData.phone,
        company_address: formData.address,
        company_logo: formData.logo,
        signature_image: formData.signature,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('business_profiles')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="settings-container">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Settings</h1>

      <div className="glass rounded-2xl p-6 scale-in">
        <h2 className="text-2xl font-semibold text-sky-900 mb-6">Business Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
                className="mt-1"
                data-testid="business-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
                data-testid="business-email-input"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
                data-testid="business-phone-input"
              />
            </div>

            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                min="0"
                max="100"
                step="0.01"
                className="mt-1"
                disabled
                title="Tax rate setting not currently supported in database"
                data-testid="tax-rate-input"
              />
              <p className="text-xs text-yellow-600 mt-1">Global tax rate setting currently unavailable</p>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1"
              rows={3}
              data-testid="business-address-input"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <p className="text-sm text-gray-500">Upload your company logo (will appear at top-left of invoices)</p>
            <div className="flex items-start gap-4">
              {formData.logo ? (
                <div className="relative">
                  <img src={formData.logo} alt="Company Logo" className="h-24 w-24 object-contain border rounded-lg p-2 bg-white" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage('logo')}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Upload size={24} className="text-gray-400" />
                </div>
              )}
              <div>
                <Input
                  ref={logoInputRef}
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Max size: 2MB, Format: PNG, JPG, JPEG</p>
              </div>
            </div>
          </div>

          {/* Signature Upload */}
          <div className="space-y-2">
            <Label htmlFor="signature">CEO Signature</Label>
            <p className="text-sm text-gray-500">Upload CEO signature (will appear at bottom-right of invoices)</p>
            <div className="flex items-start gap-4">
              {formData.signature ? (
                <div className="relative">
                  <img src={formData.signature} alt="CEO Signature" className="h-24 w-32 object-contain border rounded-lg p-2 bg-white" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage('signature')}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Upload size={24} className="text-gray-400" />
                </div>
              )}
              <div>
                <Input
                  ref={signatureInputRef}
                  id="signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Max size: 2MB, Format: PNG, JPG, JPEG</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 transition-all duration-300"
              disabled={saving}
              data-testid="save-settings-btn"
            >
              <Save size={20} className="mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}