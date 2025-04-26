
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Check, 
  X, 
  DollarSign 
} from 'lucide-react';

const PricingCard = ({ 
  title, 
  price, 
  features, 
  unavailable = [] 
}: { 
  title: string, 
  price: string, 
  features: string[], 
  unavailable?: string[] 
}) => (
  <Card className="w-full max-w-sm">
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        {title}
        <DollarSign className="h-5 w-5" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-3xl font-bold">{price}</div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {feature}
          </li>
        ))}
        {unavailable.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-muted-foreground">
            <X className="h-4 w-4 text-red-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Link to="/signup">
        <Button className="w-full">Choose {title}</Button>
      </Link>
    </CardContent>
  </Card>
);

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-creatively-purple rounded-lg w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-xl font-bold">Creatively</h1>
        </div>
        <nav className="space-x-4">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Manage Your Creative Projects Seamlessly</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Creatively helps teams collaborate, track progress, and bring ideas to life.
        </p>
        
        <div className="flex justify-center gap-6 mb-16">
          <PricingCard 
            title="Free" 
            price="$0" 
            features={[
              "Up to 5 Projects",
              "Basic Task Management",
              "Collaborative Workspace"
            ]}
            unavailable={[
              "Advanced Analytics", 
              "Priority Support",
              "Unlimited Projects"
            ]} 
          />
          <PricingCard 
            title="Basic" 
            price="$9.99/mo" 
            features={[
              "Up to 20 Projects",
              "Advanced Task Management",
              "Team Collaboration",
              "Basic Analytics"
            ]}
            unavailable={[
              "Enterprise Features",
              "Priority Support"
            ]} 
          />
          <PricingCard 
            title="Premium" 
            price="$24.99/mo" 
            features={[
              "Unlimited Projects",
              "Advanced Analytics",
              "Priority Support",
              "Custom Integrations",
              "Advanced Team Management"
            ]} 
          />
        </div>
      </main>
      
      <footer className="p-6 text-center">
        <p className="text-muted-foreground">© 2024 Creatively. All rights reserved.</p>
      </footer>
    </div>
  );
}
