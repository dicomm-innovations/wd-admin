import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { adsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Adverts = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', client: '', imageUrl: '', linkUrl: '', businessUnit: 'all', status: 'draft', order: 0 });
  const [editingAd, setEditingAd] = useState(null);
  const { success, error: showError } = useNotification();

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await adsAPI.getAll();
      setAds(res?.ads || []);
    } catch (err) {
      showError('Failed to load adverts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await adsAPI.update(editingAd._id, formData);
        success('Ad updated');
      } else {
        await adsAPI.create(formData);
        success('Ad created');
      }
      setShowModal(false);
      setEditingAd(null);
      loadAds();
    } catch (err) {
      showError(err.message || 'Failed to save advert');
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      client: ad.client || '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      businessUnit: ad.businessUnit || 'all',
      status: ad.status || 'draft',
      order: ad.order || 0,
      startsAt: ad.startsAt ? ad.startsAt.slice(0, 10) : '',
      endsAt: ad.endsAt ? ad.endsAt.slice(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (ad) => {
    if (!window.confirm('Delete this advert?')) return;
    try {
      await adsAPI.remove(ad._id);
      success('Ad deleted');
      loadAds();
    } catch (err) {
      showError('Failed to delete advert');
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'client', header: 'Client', render: (v) => v || '—' },
    { key: 'businessUnit', header: 'Unit' },
    { key: 'status', header: 'Status' },
    { key: 'order', header: 'Order' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-xs">
          <Button size="sm" variant="secondary" icon={Edit} onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="error" icon={Trash2} onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Adverts" subtitle="Manage sliding ads for mobile app">
      <Card className="mb-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Ads</h3>
            <p className="text-gray-500 text-sm">Create, update, and reorder client ads.</p>
          </div>
          <Button icon={Plus} onClick={() => { setEditingAd(null); setFormData({ title: '', client: '', imageUrl: '', linkUrl: '', businessUnit: 'all', status: 'draft', order: 0 }); setShowModal(true); }}>
            New Ad
          </Button>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={ads} loading={loading} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAd ? 'Edit Advert' : 'Create Advert'}
        size="medium"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <input className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Client</label>
            <input className="form-input" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Image URL</label>
            <input className="form-input" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Link URL</label>
            <input className="form-input" value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })} />
          </div>
          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Business Unit</label>
              <select className="form-input" value={formData.businessUnit} onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}>
                <option value="all">All</option>
                <option value="gym">Gym</option>
                <option value="spa">Spa</option>
                <option value="marketing">Marketing</option>
                <option value="childcare">Childcare</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Order</label>
            <input type="number" className="form-input" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
          </div>
          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Starts At</label>
              <input type="date" className="form-input" value={formData.startsAt || ''} onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Ends At</label>
              <input type="date" className="form-input" value={formData.endsAt || ''} onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-sm pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingAd ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Adverts;
